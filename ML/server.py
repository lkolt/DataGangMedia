from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket
import json
import kmeans_summarizer

summurizer = kmeans_summarizer.Summarizer()

clients = []
class SimpleChat(WebSocket):
    def handleMessage(self):
        print(self.data)
        js = json.loads(self.data)
        new_text = summurizer.get_summary(js['text'])
        new_data = js
        new_data['text'] = new_text
        print(f'Summurize:{new_data}')
        for client in clients:
            client.sendMessage(json.dumps(new_data))

    def handleConnected(self):
       print(self.address, 'connected')
       clients.append(self)

    def handleClose(self):
       clients.remove(self)
       print(self.address, 'closed')

server = SimpleWebSocketServer('', 8000, SimpleChat)
server.serveforever()