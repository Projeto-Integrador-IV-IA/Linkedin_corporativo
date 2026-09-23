package br.com.linkedincorporativo.profile;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurerSupport;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import java.time.Duration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.linkedincorporativo.profile.repository.SkillRepository;

@SpringBootApplication
@EnableCaching
@RestController
public class ProfileServiceApplication extends CachingConfigurerSupport {

    @Value("${spring.application.name}")
    private String serviceName;

    public static void main(String[] args) {
        SpringApplication.run(ProfileServiceApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of("service", serviceName, "status", "UP");
    }

    @GetMapping("/api/profiles/ping")
    public Map<String, String> ping() {
        return Map.of("service", serviceName, "message", "pong");
    }

    @Bean
    CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofSeconds(60))
            .disableCachingNullValues()
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(connectionFactory).cacheDefaults(defaults).build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) { }
            @Override public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) { }
            @Override public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) { }
            @Override public void handleCacheClearError(RuntimeException exception, Cache cache) { }
        };
    }

    @Bean
    CommandLineRunner seedSkills(SkillRepository repository) {
        return args -> {
            for (String name : new String[]{"Java", "Spring Boot", "React", "Python", "SQL", "PostgreSQL", "Docker", "Machine Learning", "JavaScript"}) {
                repository.findByNameIgnoreCase(name).orElseGet(() -> repository.save(new br.com.linkedincorporativo.profile.domain.Skill(name)));
            }
        };
    }
}
