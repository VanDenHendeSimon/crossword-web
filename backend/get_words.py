from repositories.DataRepository import DataRepository
from bs4 import BeautifulSoup
import requests


def get_soup_from_url(url):
    page_html = requests.get(url).text
    return BeautifulSoup(page_html, 'html.parser')


def main():
    soup = get_soup_from_url('https://www.ef.com/wwen/english-resources/english-vocabulary/top-3000-words/')
    field_items = soup.find('div', {'class': 'field-items'})

    words = [
        word.replace('\t', '') for word in
        field_items.find_all('p')[1].text.split('\n')
        if len(word) > 1
    ]

    for word in words:
        DataRepository.add_word(word)
        print('%s added to the database' % word)


if __name__ == "__main__":
    main()
