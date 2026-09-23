package br.com.linkedincorporativo.profile;

import java.util.Map;
import java.util.List;

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
import br.com.linkedincorporativo.profile.repository.ProfileRepository;
import br.com.linkedincorporativo.profile.domain.Profile;
import br.com.linkedincorporativo.profile.domain.ProfileSkill;

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
    CommandLineRunner seedDemoData(SkillRepository skillRepository, ProfileRepository profileRepository) {
        return args -> {
            for (String name : new String[]{"Java", "Spring Boot", "React", "Python", "SQL", "PostgreSQL", "Docker", "Machine Learning", "JavaScript", "TypeScript", "Node.js", "AWS", "Figma", "Product Management"}) {
                skillRepository.findByNameIgnoreCase(name).orElseGet(() -> skillRepository.save(new br.com.linkedincorporativo.profile.domain.Skill(name)));
            }

            List<DemoProfile> demoProfiles = List.of(
                new DemoProfile("Marina Costa", "marina.costa.demo@example.com", "Engenheira de Software", "Java,Spring Boot,PostgreSQL,Docker", "Especialista em APIs e plataformas distribuídas.", 8),
                new DemoProfile("Rafael Mendes", "rafael.mendes.demo@example.com", "Desenvolvedor Front-end", "React,TypeScript,JavaScript,Figma", "Constrói experiências web acessíveis e responsivas.", 6),
                new DemoProfile("Camila Oliveira", "camila.oliveira.demo@example.com", "Cientista de Dados", "Python,Machine Learning,SQL", "Atua com modelos preditivos e análise de dados.", 5),
                new DemoProfile("Bruno Almeida", "bruno.almeida.demo@example.com", "Engenheiro de Dados", "Python,SQL,PostgreSQL,AWS", "Especialista em pipelines e plataformas de dados.", 7),
                new DemoProfile("Juliana Santos", "juliana.santos.demo@example.com", "Product Manager", "Product Management,SQL,Figma,React", "Conecta estratégia, usuários e times de tecnologia.", 9),
                new DemoProfile("Diego Ferreira", "diego.ferreira.demo@example.com", "Desenvolvedor Full Stack", "Java,React,Node.js,PostgreSQL", "Experiência em produtos digitais ponta a ponta.", 4),
                new DemoProfile("Aline Rodrigues", "aline.rodrigues.demo@example.com", "Especialista em Cloud", "AWS,Docker,Python,Java", "Projeta ambientes seguros, escaláveis e observáveis.", 8),
                new DemoProfile("Lucas Martins", "lucas.martins.demo@example.com", "Desenvolvedor Backend", "Java,Spring Boot,SQL,Docker", "Focado em serviços robustos e integração de sistemas.", 5)
            );

            for (DemoProfile demo : demoProfiles) {
                if (profileRepository.findAll().stream().anyMatch(profile -> demo.email().equalsIgnoreCase(profile.getEmail()))) continue;
                Profile profile = new Profile();
                profile.setFullName(demo.name());
                profile.setEmail(demo.email());
                profile.setProfession(demo.profession());
                profile.setEducationLevel("GRADUACAO");
                profile.setYearsOfExperience(demo.years());
                profile.setBio(demo.bio());
                Profile saved = profileRepository.save(profile);
                for (String skillName : demo.skills().split(",")) {
                    skillRepository.findByNameIgnoreCase(skillName).ifPresent(skill -> saved.getSkills().add(new ProfileSkill(saved, skill, "INTERMEDIARIO", demo.years())));
                }
                profileRepository.save(saved);
            }
        };
    }

    private record DemoProfile(String name, String email, String profession, String skills, String bio, int years) {}
}
