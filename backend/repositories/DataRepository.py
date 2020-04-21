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
    def add_word(word):
        sql = """
        insert into word
        values (null, %s, null, null)
        ;
        """
        params = [word]

        return Database.execute_sql(sql, params)

    @staticmethod
    def get_all_words():
        sql = """
        select distinct(word) from word;
        """

        return Database.get_rows(sql)
