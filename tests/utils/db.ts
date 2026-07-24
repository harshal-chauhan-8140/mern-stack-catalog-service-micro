import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

export function useInMemoryDatabase() {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    }, 120000);

    beforeEach(async () => {
        await mongoose.connection.dropDatabase();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });
}
