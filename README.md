
# Processador de Webhooks - Node

Projeto tutorial para testar a execução paralela de HTTP requests com Node.js em altas cargas.

Este processador de webhooks recebe uma requisição para enviar uma certa mensagem para um endpoint de destino correspondente, chama uma função `async` para realizar o POST, e retorna imediatamente para o cliente.

Por ser apenas um teste de paralelismo, não foi implementado o controle de entrega das mensagens (e retentativas, etc).

## Instalação

Utilizando docker:
`````
git clone https://github.com/dmkorb/webhook-processor-node.git
docker build -t dmkorb/webhook-processor-node .
docker run --publish 7000:7000 --name webhook-node --rm dmkorb/webhook-processor-node
`````

Utilizando a imagem do docker hub:
`````
docker pull dmkorb/webhook-processor-node
docker run --publish 7000:7000 --name webhook-node --rm dmkorb/webhook-processor-node
`````
## Utilização

O processor expõe um endpoint para o envio de requisições, `/webhooks/message`. O `body` deve contem um objeto com dois campos, `user_id` e `data`.

O projeto contém um db dummy com dois `user_id`'s, "1" e "2".

Para testar, pode-se mandar um POST http para este endpoint: 
`````
curl  -d '{ "user_id": "1","data": "Test message to be sent to user 1"}' -H 'Content-Type: application/json' http://localhost:7000/webhooks/message
`````
O processador retornará imediatamente contendo o endpoint de destino na mensagem de retorno.

## Teste de carga

Para testar o paralelismo, podemos utilizar alguma ferramenta de teste de carga, como por exemplo o [loadtest](https://www.npmjs.com/package/loadtest).

Este comando abaixo envia 2000 mensagens, com 10 usuários paralelos e uma carga de 100 mensagens por segundo:
```
loadtest http://localhost:7000/webhooks/message -m POST -P '{ "user_id": "1","data": "This is a test message!"}' -T 'application/json' --rps 100 -n 2000 -c 10
```
Abaixo um exemplo de resultado deste teste rodando localmente, com um tempo de resposta médio de 6.9ms para 2000 requests:
```
INFO Requests: 0 (0%), requests per second: 0, mean latency: 0 ms
INFO Requests: 458 (23%), requests per second: 92, mean latency: 8 ms
INFO Requests: 958 (48%), requests per second: 100, mean latency: 6.7 ms
INFO Requests: 1458 (73%), requests per second: 100, mean latency: 6.5 ms
INFO Requests: 1958 (98%), requests per second: 100, mean latency: 6.6 ms
INFO 
INFO Target URL:          http://localhost:7000/webhooks/message
INFO Max requests:        2000
INFO Concurrency level:   10
INFO Agent:               none
INFO Requests per second: 100
INFO 
INFO Completed requests:  2000
INFO Total errors:        0
INFO Total time:          20.427033776000002 s
INFO Requests per second: 98
INFO Mean latency:        6.9 ms
INFO 
INFO Percentage of the requests served within a certain time
INFO   50%      5 ms
INFO   90%      10 ms
INFO   95%      12 ms
INFO   99%      18 ms
INFO  100%      31 ms (longest request)
```
