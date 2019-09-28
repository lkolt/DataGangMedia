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

    def preprocessing_rus(self, sentence):
        sentence = sentence.lower()
        sentence = re.sub('[^А-Яа-яA-Za-z]+', ' ', sentence).strip()
        return sentence

    def mean_sent_vector(self, sentence_tokens):
        return np.array([np.mean([self.pretrained_ft[w] for w in sentence_tokens
                                                    if w in self.pretrained_ft]
                                 or [np.zeros(300)], axis=0)])

    def __init__(self):
        print('Loading model...')
        self.pretrained_ft = gensim.models.fasttext.load_facebook_model('models/ru.bin', encoding='utf-8')
        print('Model loaded!')

    def get_summary(self, text: str):
        print('init model:', text)

        sents = sent_tokenize(text)
        sents_storage = deepcopy(sents)
        n_sents = int(round(np.sqrt(len(sents_storage))))

        print('Before:', sents)
        for i in range(len(sents)):
            sents[i] = self.preprocessing_rus(sents[i])
            sents[i] = word_tokenize(sents[i])
            sents[i] = [word for word in sents[i] if word not in stopwords.words('russian')]
            for j in range(len(sents[i])):
                sents[i][j] = pymorphy2.MorphAnalyzer().parse(sents[i][j])[0].normal_form
        print('After:', sents)

        sent_vectors = []
        for sent in sents:
            sent_vectors.append(np.squeeze(self.mean_sent_vector(sent)))
        sent_vectors = np.asarray(sent_vectors)
        print(len(sent_vectors))
        kmeans = KMeans(n_clusters=n_sents).fit(sent_vectors)
        print(kmeans)
        centre_sents_idx = []
        for j in range(n_sents):
            idx_cand = np.where(kmeans.labels_ == j)
            vec_cand = sent_vectors[idx_cand]
            closest, dist = pairwise_distances_argmin_min([kmeans.cluster_centers_[j]], vec_cand)
            centre_sents_idx.append(idx_cand[0][int(closest)])
        centre_sents_idx = sorted(centre_sents_idx)
        print(centre_sents_idx)
        summary = ' '.join([sents_storage[i] for i in centre_sents_idx])
        print(summary)
        return summary