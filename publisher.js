import amqp  from 'amqplib/callback_api.js'

export function postQueue(queueName, message) {
  amqp.connect(`amqp://localhost`, (err, connection) => {
    if (err) {
      throw err;
    }
    connection.createChannel((err, channel) => {
      if (err) {
        throw err;
      }

      channel.assertQueue(queueName, {
        durable: false,
      });
      channel.sendToQueue(queueName, message);
    });
  });
}
