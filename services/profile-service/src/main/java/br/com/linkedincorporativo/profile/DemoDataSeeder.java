package br.com.linkedincorporativo.profile;

import br.com.linkedincorporativo.profile.domain.PortfolioProject;
import br.com.linkedincorporativo.profile.domain.Profile;
import br.com.linkedincorporativo.profile.repository.ProfileRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoDataSeeder implements CommandLineRunner {
    private final ProfileRepository profiles;

    public DemoDataSeeder(ProfileRepository profiles) {
        this.profiles = profiles;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (DemoProfile demo : demoProfiles()) {
            Profile profile = profiles.findByEmailIgnoreCase(demo.email()).orElseGet(Profile::new);
            profile.setFullName(demo.name());
            profile.setEmail(demo.email());
            profile.setProfession(demo.profession());
            profile.setEducationLevel(demo.education());
            profile.setYearsOfExperience(demo.years());
            profile.setBio(demo.bio());
            profile.getSkills().clear();
            profile.getPortfolioProjects().removeIf(project -> project.getSourceProjectId() == null);
            for (DemoProject project : demo.projects()) {
                profile.getPortfolioProjects().add(new PortfolioProject(profile, project.title(), project.description(), ""));
            }
            profiles.save(profile);
        }
    }

    private static List<DemoProfile> demoProfiles() {
        return List.of(
            new DemoProfile(
                "Marina Costa", "marina.costa.demo@example.com", "Engenheira de Software Backend",
                "Bacharelado em Engenharia de Software", 8,
                "Engenheira de software backend com experiência em plataformas distribuídas e serviços de alta disponibilidade. Atua no desenho de APIs, integrações assíncronas, persistência de dados, observabilidade e evolução de sistemas críticos, trabalhando próxima às equipes de produto e operação para transformar necessidades de negócio em soluções confiáveis.",
                List.of(
                    new DemoProject("Plataforma de pedidos para marketplace", "Projetou e implantou serviços responsáveis pelo ciclo de pedidos de um marketplace, incluindo criação, pagamento, cancelamento e acompanhamento. Estruturou idempotência, filas de processamento, persistência em PostgreSQL, métricas e rastreamento distribuído, reduzindo falhas em picos de acesso e facilitando a investigação de incidentes."),
                    new DemoProject("Integração de faturamento empresarial", "Desenvolveu uma camada de integração entre contratos, consumo e faturamento. Organizou validações, retentativas, conciliação e trilhas de auditoria para garantir consistência financeira, além de criar alertas operacionais para identificar divergências antes do fechamento mensal.")
                )
            ),
            new DemoProfile(
                "Rafael Mendes", "rafael.mendes.demo@example.com", "Desenvolvedor Frontend",
                "Tecnologia em Análise e Desenvolvimento de Sistemas", 6,
                "Desenvolvedor frontend especializado em aplicações web acessíveis, responsivas e orientadas a componentes. Trabalha com descoberta técnica, integração com APIs, design systems, testes automatizados e análise de desempenho, colaborando com design e produto para entregar jornadas simples e consistentes em diferentes dispositivos.",
                List.of(
                    new DemoProject("Portal de autoatendimento", "Modernizou um portal de autoatendimento utilizado por clientes para consultar contratos, pagamentos e solicitações. Reestruturou a navegação, criou componentes reutilizáveis, melhorou a acessibilidade por teclado e implantou testes das jornadas críticas, reduzindo erros de interface e tempo de carregamento."),
                    new DemoProject("Design system para múltiplos produtos", "Construiu uma biblioteca compartilhada de componentes com documentação de comportamento, estados, responsividade e acessibilidade. Apoiou a migração dos produtos existentes e criou uma rotina de revisão com designers e desenvolvedores para manter consistência sem bloquear a evolução das equipes.")
                )
            ),
            new DemoProfile(
                "Camila Oliveira", "camila.oliveira.demo@example.com", "Cientista de Dados",
                "Mestrado em Estatística Aplicada", 5,
                "Cientista de dados com experiência em modelos preditivos, experimentação e análise de comportamento de clientes. Conduz o trabalho desde a definição do problema e preparação dos dados até a validação, explicação e monitoramento dos modelos, apresentando resultados de forma clara para áreas técnicas e de negócio.",
                List.of(
                    new DemoProject("Modelo de previsão de cancelamento", "Desenvolveu um modelo de risco de cancelamento a partir de dados de uso, atendimento e cobrança. Definiu métricas e amostras de validação, analisou os fatores que influenciavam as previsões e integrou os resultados a uma rotina de priorização para o time de retenção."),
                    new DemoProject("Previsão de demanda comercial", "Criou uma solução para estimar demanda por região e categoria de produto. Comparou abordagens estatísticas e de aprendizado de máquina, incorporou sazonalidade e eventos comerciais e entregou intervalos de confiança para apoiar decisões de estoque e planejamento.")
                )
            ),
            new DemoProfile(
                "Bruno Almeida", "bruno.almeida.demo@example.com", "Engenheiro de Dados",
                "Bacharelado em Sistemas de Informação", 7,
                "Engenheiro de dados dedicado à construção de plataformas confiáveis para ingestão, processamento e disponibilização de informações. Atua com dados em lote e em tempo real, qualidade, catálogo, governança, custos e observabilidade, oferecendo bases consistentes para análises, relatórios e produtos inteligentes.",
                List.of(
                    new DemoProject("Plataforma de eventos em tempo real", "Desenhou pipelines para receber e processar eventos de navegação, compra e atendimento em tempo real. Implementou validações de esquema, tratamento de duplicidades, particionamento e monitoramento de atrasos, permitindo que áreas de produto acompanhassem indicadores com baixa latência."),
                    new DemoProject("Camada analítica corporativa", "Organizou dados comerciais e financeiros em modelos analíticos documentados. Implantou verificações automáticas de qualidade, linhagem e alertas de atualização, reduzindo divergências entre relatórios e tornando as fontes mais confiáveis para as equipes de análise.")
                )
            ),
            new DemoProfile(
                "Juliana Santos", "juliana.santos.demo@example.com", "Product Manager",
                "MBA em Gestão de Produtos Digitais", 9,
                "Product manager com experiência em descoberta, estratégia e evolução de produtos digitais. Conecta necessidades de usuários, objetivos de negócio e restrições técnicas, conduzindo pesquisas, priorização, definição de métricas e experimentos em parceria com design, engenharia, atendimento e áreas comerciais.",
                List.of(
                    new DemoProject("Jornada digital de contratação", "Liderou a revisão de uma jornada de contratação com alto abandono. Combinou entrevistas, dados de funil e análise de chamados para identificar barreiras, priorizou hipóteses com o time e acompanhou experimentos que simplificaram o cadastro e melhoraram a conclusão da jornada."),
                    new DemoProject("Painel de saúde do produto", "Definiu indicadores de adoção, recorrência, satisfação e resultado para um produto B2B. Estruturou rituais de análise com as equipes e vinculou as métricas às decisões de roadmap, tornando mais clara a relação entre entregas e impacto para clientes.")
                )
            ),
            new DemoProfile(
                "Diego Ferreira", "diego.ferreira.demo@example.com", "Desenvolvedor Full Stack",
                "Bacharelado em Ciência da Computação", 4,
                "Desenvolvedor full stack com experiência na entrega de produtos digitais completos, desde interfaces e APIs até persistência e operação. Participa do refinamento das necessidades, propõe soluções simples, escreve testes e acompanha o comportamento em produção, com atenção a segurança, desempenho e manutenção.",
                List.of(
                    new DemoProject("Gestão de assinaturas digitais", "Desenvolveu funcionalidades para contratação, alteração de plano, cobrança e cancelamento de assinaturas. Implementou telas responsivas, APIs transacionais, histórico de mudanças e tratamento de falhas de pagamento, apoiando também o monitoramento após a publicação."),
                    new DemoProject("Portal interno de operações", "Construiu um portal para centralizar consultas e ações antes distribuídas em planilhas e sistemas distintos. Criou permissões por função, trilhas de auditoria, filtros e exportações, reduzindo o tempo necessário para análise e resolução de solicitações operacionais.")
                )
            ),
            new DemoProfile(
                "Aline Rodrigues", "aline.rodrigues.demo@example.com", "Especialista em Cloud e Plataforma",
                "Pós-graduação em Arquitetura de Soluções", 8,
                "Especialista em cloud e engenharia de plataforma com atuação em ambientes seguros, escaláveis e observáveis. Automatiza infraestrutura, entrega contínua e políticas operacionais, além de apoiar equipes de desenvolvimento na adoção de padrões que aumentam autonomia sem comprometer governança e confiabilidade.",
                List.of(
                    new DemoProject("Plataforma de implantação self-service", "Criou uma plataforma interna para que equipes publicassem serviços por meio de modelos padronizados. Automatizou infraestrutura, configuração, observabilidade e políticas de segurança, diminuindo etapas manuais e oferecendo um caminho consistente da revisão de código até produção."),
                    new DemoProject("Programa de confiabilidade e custos", "Mapeou serviços críticos, metas de disponibilidade e principais fontes de custo. Implantou painéis, alertas acionáveis, revisão de capacidade e práticas de resposta a incidentes, reduzindo desperdícios e melhorando a previsibilidade operacional.")
                )
            ),
            new DemoProfile(
                "Lucas Martins", "lucas.martins.demo@example.com", "Desenvolvedor Backend",
                "Bacharelado em Engenharia de Computação", 5,
                "Desenvolvedor backend focado em serviços robustos, integrações corporativas e processamento de dados transacionais. Trabalha com desenho de contratos, regras de negócio, bancos relacionais, testes, desempenho e observabilidade, buscando reduzir acoplamento e facilitar a evolução segura dos sistemas.",
                List.of(
                    new DemoProject("Hub de integrações corporativas", "Desenvolveu um hub para integrar sistemas comerciais, financeiros e logísticos. Padronizou contratos, autenticação, retentativas e rastreamento das chamadas, permitindo acompanhar cada operação e reduzir falhas causadas por diferenças entre os sistemas conectados."),
                    new DemoProject("Processamento de fechamento financeiro", "Reestruturou rotinas de fechamento que processavam grandes volumes de registros. Separou etapas, otimizou consultas, adicionou checkpoints e relatórios de inconsistência, reduzindo o tempo total e permitindo retomada segura em caso de interrupção.")
                )
            )
        );
    }

    private record DemoProfile(String name, String email, String profession, String education, int years,
                               String bio, List<DemoProject> projects) {}
    private record DemoProject(String title, String description) {}
}
