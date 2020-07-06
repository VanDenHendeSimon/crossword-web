from repositories.DataRepository import DataRepository
from repositories.PDFController import PDFController


def main():
    # Gives you the filepath of the downloaded pdf
    pdf = PDFController.download(
        'https://www.planetebook.com/free-ebooks/frankenstein.pdf',
        './data/'
    )
    # words = PDFController.read('./data/test.pdf')
    words = PDFController.read(pdf)

    print(len(words))
    for word in words[:100]:
        print(word)

    # for word in words:
    #     DataRepository.add_word(word)
    #     print('%s added to the database' % word)


if __name__ == "__main__":
    main()
