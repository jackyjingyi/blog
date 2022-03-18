a = [1, 2, 3]
b = [2, 3, 1]
zip = {}  # defaultdict
min_sum = len(a + b) * 2
acp = []
for idx, val in enumerate(a + b):
    tmp = min_sum
    if val in zip.keys():
        zip.get(val)[0].append(idx)
        zip.get(val)[1] = sum(zip.get(val)[0])
        tmp = zip.get(val)[1]
    else:
        zip[val] = [[idx], sum([idx])]
    if tmp < min_sum:
        acp.append((tmp, val))
    min_sum = min(min_sum, tmp)
print([i[1] for i in acp if i[0] == min_sum])

l = {'1': 12, 'b': 23, 'c': 345, 'd': 11}
minv = 99999 * 10
cap = []
for k, v in l.items():
    tmp = v
    if tmp < minv:
        minv = tmp
        cap = []
    elif tmp > minv:
        continue
    else:
        cap = [k]
