from .Database import Database


class DataRepository:
    @staticmethod
    def json_or_formdata(request):
        # Used when requesting from a form / from json
        if request.content_type == 'application/json':
            data = request.get_json()
        else:
            data = request.form.to_dict()

        return data

    @staticmethod
    def read_categories_and_values():
        sql = """
        select
        c.name, count(c.name) as amount, c.description
        from location as l
            join establishment as e on e.locationId = l.id
                join subcategory as sc on sc.Id = e.SubcategoryId
                    join category as c on c.Id = sc.CategoryId
        group by c.name, c.description
        order by c.name
        ;
        """

        return Database.get_rows(sql)

    @staticmethod
    def read_data_within_range(min_lat, max_lat, min_long, max_long):
        """
        Fetches all datapoitns within the given bounds
        Also does some rounding when grouping
        so we eliminate multiple datapoints on / in close proximity
        the same coordinates (like bus stops on each side of the street)
        """

        sql = """
        select
            l.lat, l.lng, c.name as 'category', e.label
        from location as l
        join establishment as e on e.locationId = l.id
            join subcategory as sc on sc.Id = e.SubcategoryId
                join category as c on c.Id = sc.CategoryId
        WHERE
            l.lat < %s and
            l.lat > %s and
            l.lng < %s and
            l.lng > %s
        group by
            l.lat,
            l.lng,
            c.name,
            e.label
        limit 50000
        ;
        """
        params = [max_lat, min_lat, max_long, min_long]

        return Database.get_rows(sql, params)

    @staticmethod
    def check_sub_category(name):
        sql = """
        SELECT Id FROM subcategory
        WHERE Name = %s
        """
        params = [name]

        return Database.get_one_row(sql, params)

    @staticmethod
    def create_sub_category(name, category_id):
        # name is set to be unique in the model,
        # so no need to validate with additional queries
        sql = """
        insert into subcategory
        values (null, %s, %s);
        """
        params = [name, category_id]

        return Database.execute_sql(sql, params)

    @staticmethod
    def check_location(lat, lng):
        sql = """
        SELECT Id FROM location
        WHERE Lat = %s and Lng = %s
        """
        params = [lat, lng]

        return Database.get_one_row(sql, params)

    @staticmethod
    def check_location_using_address(address):
        street = address.split('$')[0]
        housenumber = address.split('$')[1]
        zipcode = address.split('$')[2]
        city = address.split('$')[3]

        sql = """
        SELECT lat, lng FROM location
        WHERE street = %s and housenumber = %s and zipcode = %s and city = %s
        """
        params = [street, housenumber, zipcode, city]

        return Database.get_one_row(sql, params)

    @staticmethod
    def create_location(lat, lng, street, housenumber, zipcode, city):
        sql = """
        INSERT INTO location
        VALUES (null, %s, %s, %s, %s, %s, %s)
        """
        params = [lat, lng, street, housenumber, zipcode, city]

        return Database.execute_sql(sql, params)

    @staticmethod
    def create_establishment(subcategory_id, location_id, label, website):
        sql = """
        INSERT INTO establishment
        VALUES (null, %s, %s, %s, %s)
        """
        params = [subcategory_id, location_id, label, website]

        return Database.execute_sql(sql, params)

    @staticmethod
    def remove_all_locations():
        Database.execute_sql("delete from locatie where id > -1;")
        Database.execute_sql("delete from establishment where id > -1;")
