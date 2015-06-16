// Inspired by Dojo and also by: http://davidwalsh.name/pubsub-javascript

var subscriptions: { [id: string]: { [id2: string]: Function } } = {};

var subscriptionsCount = 0;

export function subscribe(topic, callback) {
    var topicKey = JSON.stringify(topic);
    
    if (!subscriptions[topicKey]) subscriptions[topicKey] = {};

    var uniqueIndex = subscriptionsCount++;
    subscriptions[topicKey][uniqueIndex] = callback;

    return {
        remove: function() {
            delete subscriptions[topicKey][uniqueIndex];
        }
    };
}

export function publish(topic, ...data: any[]) {
    var topicKey = JSON.stringify(topic);
    
    if (!subscriptions[topicKey]) return;

    var callbacksForTopic = subscriptions[topicKey];
    for (var callbackKey in callbacksForTopic) {
        var callback = callbacksForTopic[callbackKey];
        callback.apply(null, data);
    }
}
