import app from "./app";
import { initDb } from "./config/db";
import logger from "./config/logger";
import { config } from "./config";
import { createMessageProducerBroker } from "./common/factories/brokerFactory";
import { MessageProducerBroker } from "./common/types/broker";

const startServer = async () => {
    const PORT = config.PORT;
    let messageProducerBroker: MessageProducerBroker | null = null;
    try {
        await initDb();
        logger.info("Database connected successfully.");

        messageProducerBroker = createMessageProducerBroker();
        await messageProducerBroker.connect();

        logger.info("Kafka broker connected successfully.");

        app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (messageProducerBroker) {
                await messageProducerBroker.disconnect();
            }

            logger.error(err.message);
            logger.on("finish", () => {
                process.exit(1);
            });
        }
    }
};

void startServer();
