import csv
from urllib.parse import unquote

def csv_encode(fp):
    with open('2.txt', 'w') as f1:
        with open(fp) as f:
            reader = csv.reader(f)
            z1 = list(reader)
            for z,i in enumerate(z1):
                if len(i[1]) > 10:
                    try:
                        i[1] = unquote(i[1])
                    except:
                        continue
                try:
                    f1.write(" ".join(i)+ "\n")
                except:
                    print(z,i)
                    f1.write("none")
f = "D:\\code\\django_blog\\django_blog\\0000017F91DA5AB396498577FEC48207_1.csv"

csv_encode(f)