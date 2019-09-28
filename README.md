# DataGangMedia

Summurazer bot for VC.ru!

## Requirements

Node.js > v10.15.1

Npm > 6.4.1

Python > 3.7.2

## Build

### Build ML
Download models from google drive:
[model1](https://drive.google.com/open?id=1Uyl6JQrH4oekeoJBKUvPCIFvuKX0WIsw)
and
[model2](https://drive.google.com/open?id=1FwnWY6fPeRgpUEllvuK7tj-F2U_STNd_)

And move it into ```/models/```:

``` mv run.bin models/```

``` mv classification_pipeline.pkl models/```

install requirements:

``` pip3 install -r ML/requirements.txt```

Download nltk data:

``` python3 -m nltk.downloader all ```

And download all packages!

### Build node app
```cd VCBot```

```npm install```

Add VC token to ```token``` file and VK token to ```apis/vk.config``` filee

## Run
Run ML: ``` python3 ML/server.py```. And waiting label ```Model loaded!```

Now you can run bot: 

``` cd VCBot```

``` npm start```