import { config } from "../../config";
import { KafkaProducerBroker } from "../../config/kafka";
import { MessageProducerBroker } from "../types/broker";

let messageProducerBroker: MessageProducerBroker | null = null;

export const createMessageProducerBroker = (): MessageProducerBroker => {
    if (!messageProducerBroker) {
        messageProducerBroker = new KafkaProducerBroker("catalog-service", [
            config.KAFKA_BROKER,
        ]);
    }

    return messageProducerBroker;
};
