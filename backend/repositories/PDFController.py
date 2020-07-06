import requests
import PyPDF2
import os
import re


class PDFController:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0'
    }
    def __init__(self):
        pass

    @staticmethod
    def local_path(url, directory):
        return os.path.join(directory, url[url.rfind('/')+1:])

    @staticmethod
    def download(url, directory='./'):
        path = PDFController.local_path(url, directory)

        if not os.path.exists(path):
            print("Downloading %s" % url)
            response = requests.get(url, headers=PDFController.headers)
            
            # Write to disk
            with open(path, 'wb') as f:
                f.write(response.content)

        return path

    @staticmethod
    def read(pdf_file):
        try:
            pdf_object = PyPDF2.PdfFileReader(pdf_file)
        except Exception:
            return None

        num_pages = pdf_object.getNumPages()

        words = []
        for page_number in range(num_pages):
            page = pdf_object.getPage(page_number)
            # replace random linebreaks
            text = page.extractText().replace(chr(10), '').lower()

            for word in re.findall(r'\w+', text):
                # Check if word is valid (long enough and only alphabetic)
                if word not in words and len(word) >= 4 and word.isalpha():
                    words.append(word)

        # make sure all doubles are taken out
        return list(set(words))
