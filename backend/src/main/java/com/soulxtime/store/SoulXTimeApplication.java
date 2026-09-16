package com.soulxtime.store;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * AFINO — Premium Watch Commerce Platform
 * Main application entry point.
 *
 * Architecture principle: Spring Boot owns all critical business logic.
 * The frontend is purely presentational; all prices, discounts, inventory,
 * and billing calculations happen exclusively here.
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableTransactionManagement
@EnableScheduling
@ConfigurationPropertiesScan
public class SoulXTimeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SoulXTimeApplication.class, args);
    }
}
