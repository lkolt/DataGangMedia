# DataGangMedia

Summurazer bot for VC.ru!

## Requirements

Node.js > v10.15.1

Npm > 6.4.1

Python > 3.7.2

## Build

### Build ML
Download model from google drive:
[model](https://drive.google.com/open?id=1Uyl6JQrH4oekeoJBKUvPCIFvuKX0WIsw)

And move it into ```/models/```:

``` mv run.bin models/```

install requirements:

``` pip3 install -r ML/requirements.txt```

Download nltk data:

``` python3 ```

``` import nltk ```

``` nltk.download() ```

And download all packages!

### Build node app
```cd VCBot```

```npm install```

Add VC token to ```token``` file and VK token to ```apis/vk.config``` filee

## Run
Run ML: ``` python3 ML/server.py```

Run bot: 

``` cd VCBot```

``` npm start```