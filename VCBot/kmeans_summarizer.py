import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances_argmin_min
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize
from copy import deepcopy
import gensim
import pymorphy2
import re


class Summarizer:

    def preprocessing_rus(sentence):
        sentence = sentence.lower()
        sentence = re.sub('[^А-Яа-яA-Za-z]+', ' ', sentence).strip()
        return sentence

    def mean_sent_vector(sentence_tokens):
        return np.array([np.mean([pretrained_ft[w] for w in sentence_tokens
                                                    if w in pretrained_ft]
                                 or [np.zeros(300)], axis=0)])

    def get_summary(text: str):
        sents = sent_tokenize(text)
        sents_storage = deepcopy(sents)
        n_sents = round(np.sqrt(len(sents_storage)))

        for i in range(len(sents)):
            sents[i] = preprocessing_rus(sents[i])
            sents[i] = word_tokenize(sents[i])
            sents[i] = [word for word in sents[i] if word not in stopwords.words('russian')]
            for j in range(len(sents[i])):
                sents[i][j] = pymorphy2.MorphAnalyzer().parse(sents[i][j])[0].normal_form

        pretrained_ft = gensim.models.fasttext.load_facebook_model('ru.bin', encoding='utf-8')

        sent_vectors = []
        for sent in sents:
            sent_vectors.append(np.squeeze(mean_sent_vector(sent)))
        sent_vectors = np.asarray(sent_vectors)

        kmeans = KMeans(n_clusters=n_sents).fit(sent_vectors)

        centre_sents_idx = []
        for j in range(n_clusters):
            idx_cand = np.where(kmeans.labels_ == j)
            vec_cand = sent_vectors[idx_cand]
            closest, dist = pairwise_distances_argmin_min([kmeans.cluster_centers_[j]], vec_cand)
            centre_sents_idx.append(idx_cand[0][int(closest)])
        centre_sents_idx = sorted(centre_sents_idx)

        summary = ' '.join([sents_storage[i] for i in centre_sents_idx])

        return summary
