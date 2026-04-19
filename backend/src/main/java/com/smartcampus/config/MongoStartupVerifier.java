package com.smartcampus.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MongoStartupVerifier implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(MongoStartupVerifier.class);

    private final MongoTemplate mongoTemplate;

    @Value("${spring.data.mongodb.uri:}")
    private String mongoUri;

    public MongoStartupVerifier(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Document pingResult = mongoTemplate.executeCommand(new Document("ping", 1));
        String dbName = mongoTemplate.getDb().getName();

<<<<<<< HEAD
        ensureTicketsCollection();
        ensureBookingsCollection();

=======
>>>>>>> ae31933d4c5b938a7be19bce3b8c52635ecb13d4
        logger.info("MongoDB connected successfully. database='{}', uri='{}', ping='{}'",
                dbName,
                sanitizeUri(mongoUri),
                pingResult.get("ok"));
    }

<<<<<<< HEAD
    private void ensureTicketsCollection() {
        String collectionName = "tickets";
        if (!mongoTemplate.collectionExists(collectionName)) {
            mongoTemplate.createCollection(collectionName);
            logger.info("Created MongoDB collection '{}'", collectionName);
        }
    }

    private void ensureBookingsCollection() {
        String collectionName = "bookings";
        if (!mongoTemplate.collectionExists(collectionName)) {
            mongoTemplate.createCollection(collectionName);
            logger.info("Created MongoDB collection '{}'", collectionName);
        }
    }

=======
>>>>>>> ae31933d4c5b938a7be19bce3b8c52635ecb13d4
    private String sanitizeUri(String uri) {
        if (uri == null || uri.isBlank()) {
            return "<not-set>";
        }

        int schemeEnd = uri.indexOf("://");
        int atIndex = uri.indexOf('@');
        if (schemeEnd > -1 && atIndex > schemeEnd) {
            return uri.substring(0, schemeEnd + 3) + "***:***" + uri.substring(atIndex);
        }

        return uri;
    }
}
