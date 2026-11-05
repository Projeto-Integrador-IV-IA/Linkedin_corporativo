"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Fingerprint,
  Layers3,
  Menu,
  MessageSquare,
  MoveUpRight,
  Network,
  ScanLine,
  Sparkles,
  X
} from "lucide-react"
import { Brand } from "@/components/brand"

const capabilities = [
  {
    icon: ScanLine,
    number: "01",
    title: "O contexto faz a diferença.",
    text: "Seu trabalho conta uma história. Descrições profissionais e projetos realizados ajudam a encontrar conexões com mais sentido.",
    tag: "Matching por descrição",
    className: "feature-context"
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Suas ideias, mais claras.",
    text: "Uma IA que faz perguntas, organiza suas experiências e ajuda a escrever. A palavra final continua sendo sua.",
    tag: "Escrita assistida por IA",
    className: "feature-ai"
  },
  {
    icon: MessageSquare,
    number: "03",
    title: "Da descoberta à conversa.",
    text: "Explore o feed, demonstre interesse e converse sobre os próximos passos. Tudo no mesmo espaço de trabalho.",
    tag: "Conexões que avançam",
    className: "feature-chat"
  }
]

function ProductPreview() {
  return (
    <div
      className="product-scene"
      aria-label="Prévia ilustrativa da plataforma"
    >
      <div className="scene-orbit scene-orbit-one" />
      <div className="scene-orbit scene-orbit-two" />
      <div className="preview-window">
        <div className="preview-toolbar">
          <span className="flex gap-1.5">
            <i />
            <i />
            <i />
          </span>
          <span>Seu próximo capítulo começa aqui</span>
          <Layers3 size={14} />
        </div>
        <div className="preview-body">
          <div className="preview-sidebar">
            <span className="preview-avatar">AC</span>
            <span className="preview-side-line" />
            <span className="preview-side-line short" />
            <div className="preview-nav active">
              <Network size={15} />
              <span>Oportunidades</span>
            </div>
            <div className="preview-nav">
              <Fingerprint size={15} />
              <span>Meu perfil</span>
            </div>
            <div className="preview-nav">
              <MessageSquare size={15} />
              <span>Mensagens</span>
            </div>
            <div className="preview-side-bottom">
              <span className="status-dot" /> Seu espaço de conexões
            </div>
          </div>
          <div className="preview-feed">
            <div className="flex items-center justify-between">
              <span className="eyebrow">EXPLORE POSSIBILIDADES</span>
              <ArrowUpRight size={19} />
            </div>
            <h3>
              Encontre seu
              <br />
              próximo desafio.
            </h3>
            <div className="preview-project">
              <div className="flex items-center justify-between">
                <span className="preview-project-icon">
                  <Layers3 size={22} />
                </span>
                <span className="preview-status">Aberto</span>
              </div>
              <h4>Uma nova experiência digital</h4>
              <p>
                Conectando estratégia, design e tecnologia para transformar uma
                ideia em produto.
              </p>
              <div className="preview-project-footer">
                <span className="flex -space-x-2">
                  <i>LC</i>
                  <i>RF</i>
                  <i>MS</i>
                </span>
                <span>
                  Conhecer projeto <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
            <div className="preview-message">
              <span className="preview-avatar small">LC</span>
              <div>
                <strong>Vamos construir juntos?</strong>
                <p>Uma boa conversa abre possibilidades.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="floating-note note-top">
        <span className="note-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <strong>Mais contexto. Mais conexão.</strong>
          <span>Sua experiência ganha destaque.</span>
        </div>
      </div>
      <div className="floating-note note-bottom">
        <span className="note-check">
          <Check size={17} />
        </span>
        <div>
          <strong>Seu próximo passo</strong>
          <span>Mais perto de acontecer.</span>
        </div>
        <ArrowUpRight size={21} />
      </div>
      <span className="preview-disclaimer">
        Visualização ilustrativa do produto
      </span>
    </div>
  )
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const nodes =
      root.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? []
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.IntersectionObserver
    )
      return
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        }),
      { threshold: 0.08 }
    )
    nodes.forEach((node) => {
      node.classList.add("reveal-ready")
      observer.observe(node)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={root} className="landing">
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <header className="landing-header">
        <div className="landing-container flex items-center justify-between gap-6">
          <Brand />
          <nav
            aria-label="Navegação do site"
            className="hidden items-center gap-8 text-sm font-medium md:flex"
          >
            <a href="#plataforma">A plataforma</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#para-quem">Para quem</a>
          </nav>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="hidden text-sm font-semibold sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="marketing-button small hidden sm:inline-flex"
            >
              Começar agora <ArrowUpRight size={16} />
            </Link>
            <button
              type="button"
              className="p-2 md:hidden"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="landing-menu"
            aria-label="Navegação móvel"
            className="landing-mobile-menu"
          >
            <a href="#plataforma" onClick={() => setMenuOpen(false)}>
              A plataforma
            </a>
            <a href="#como-funciona" onClick={() => setMenuOpen(false)}>
              Como funciona
            </a>
            <a href="#para-quem" onClick={() => setMenuOpen(false)}>
              Para quem
            </a>
            <Link href="/login">Entrar na plataforma</Link>
            <Link href="/register">
              Criar minha conta <ArrowUpRight size={16} />
            </Link>
          </nav>
        )}
      </header>
      <main id="conteudo">
        <section className="landing-hero landing-container">
          <div className="hero-copy">
            <div className="hero-label">
              <span className="status-dot" /> CONEXÕES COM PROPÓSITO
            </div>
            <h1>
              Talento encontra
              <br />
              oportunidade.
              <br />
              <span>O resto é futuro.</span>
            </h1>
            <p>
              Existe um projeto que precisa da sua experiência.
              <br className="hidden lg:block" /> E uma pessoa capaz de levar sua
              ideia além.
              <br className="hidden lg:block" /> A Synapse conecta essas
              possibilidades.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="marketing-button">
                Encontre sua próxima conexão <ArrowUpRight size={19} />
              </Link>
              <a href="#como-funciona" className="marketing-link">
                Conheça a plataforma <ArrowDown size={17} />
              </a>
            </div>
            <div className="hero-footnote">
              <span className="flex -space-x-2">
                <span className="mini-person person-one">AC</span>
                <span className="mini-person person-two">LC</span>
                <span className="mini-person person-three">RF</span>
              </span>
              <p>
                Experiências diferentes.
                <br />
                <strong>Novas possibilidades, juntos.</strong>
              </p>
            </div>
          </div>
          <ProductPreview />
        </section>
        <div className="landing-principles">
          <div className="landing-container">
            <span>BOAS CONEXÕES COMEÇAM COM</span>
            <p>
              <Fingerprint /> Experiência real
            </p>
            <p>
              <ScanLine /> Contexto profissional
            </p>
            <p>
              <MessageSquare /> Conversas relevantes
            </p>
          </div>
        </div>
        <section id="plataforma" className="landing-section landing-container">
          <div data-reveal className="section-intro">
            <div>
              <span className="eyebrow">MENOS RUÍDO. MAIS POSSIBILIDADES.</span>
              <h2>
                Seu potencial merece
                <br />o contexto certo<span className="accent-period">.</span>
              </h2>
            </div>
            <p>
              Uma rede pensada para aproximar o que você já construiu daquilo
              que ainda pode construir.
            </p>
          </div>
          <div className="feature-grid">
            {capabilities.map(({ icon: Icon, ...item }) => (
              <article
                key={item.number}
                data-reveal
                className={`feature-card ${item.className}`}
              >
                <div className="feature-card-top">
                  <span className="feature-icon">
                    <Icon size={25} />
                  </span>
                  <span>{item.number}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className="feature-tag">
                  {item.tag}
                  <ArrowUpRight size={17} />
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="como-funciona" className="process-section">
          <div className="landing-container process-grid">
            <div data-reveal>
              <span className="eyebrow">UM CAMINHO MAIS NATURAL</span>
              <h2>
                Da sua experiência
                <br />
                ao próximo
                <br />
                <em>grande passo.</em>
              </h2>
              <Link href="/register" className="marketing-link light-link">
                Comece pela sua história <ArrowUpRight size={20} />
              </Link>
              <div className="connection-art" aria-hidden="true">
                <div className="connection-node">
                  <Fingerprint size={30} />
                </div>
                <div className="connection-line">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="connection-node center-node">
                  <Network size={36} />
                </div>
                <div className="connection-line">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="connection-node">
                  <Layers3 size={30} />
                </div>
              </div>
            </div>
            <ol className="process-steps">
              {[
                {
                  title: "Conte o que você faz.",
                  text: "Apresente sua trajetória e os projetos dos quais participou. A IA ajuda a transformar sua experiência em uma descrição clara."
                },
                {
                  title: "Descubra onde você se conecta.",
                  text: "Explore oportunidades e demonstre interesse. Ao publicar um projeto, encontre profissionais a partir das descrições e experiências."
                },
                {
                  title: "Comece uma boa conversa.",
                  text: "Avance com os profissionais recomendados e mantenha as conversas perto dos projetos. O próximo passo é de vocês."
                }
              ].map((step, index) => (
                <li key={step.title} data-reveal>
                  <span className="step-number">0{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                  <MoveUpRight size={21} />
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section id="para-quem" className="landing-section landing-container">
          <div data-reveal className="section-intro">
            <div>
              <span className="eyebrow">
                DOIS LADOS. UMA NOVA POSSIBILIDADE.
              </span>
              <h2>
                O próximo capítulo
                <br />é uma construção coletiva.
              </h2>
            </div>
          </div>
          <div className="audience-grid">
            <article data-reveal>
              <span className="audience-label">PARA PROFISSIONAIS</span>
              <Fingerprint
                className="audience-art"
                strokeWidth={0.75}
                aria-hidden="true"
              />
              <h3>
                Seu trabalho fala.
                <br />
                Dê espaço a ele.
              </h3>
              <p>
                Reúna suas experiências, explore projetos e encontre um lugar
                para fazer a diferença.
              </p>
              <Link href="/register" className="marketing-link">
                Quero encontrar oportunidades <ArrowUpRight size={18} />
              </Link>
            </article>
            <article data-reveal>
              <span className="audience-label">PARA QUEM CONTRATA</span>
              <Network
                className="audience-art"
                strokeWidth={0.75}
                aria-hidden="true"
              />
              <h3>
                Grandes ideias precisam
                <br />
                das pessoas certas.
              </h3>
              <p>
                Publique seu desafio com clareza e descubra experiências que
                conversam com o seu projeto.
              </p>
              <Link href="/register" className="marketing-link">
                Quero encontrar profissionais <ArrowUpRight size={18} />
              </Link>
            </article>
          </div>
        </section>
        <section className="landing-container faq-section">
          <div data-reveal>
            <span className="eyebrow">ANTES DO PRÓXIMO PASSO</span>
            <h2>Vamos esclarecer?</h2>
          </div>
          <div data-reveal className="faq-list">
            {[
              {
                q: "Como são feitas as recomendações?",
                a: "A plataforma compara a descrição do projeto com a descrição profissional e as experiências do portfólio. O interesse demonstrado é exibido separadamente e não altera a pontuação nem a ordenação."
              },
              {
                q: "A IA escreve tudo por mim?",
                a: "Ela ajuda a organizar suas ideias, faz perguntas e propõe uma descrição. Você pode aceitar, editar ou pedir refinamentos dentro do limite de uso. A decisão de publicar é sempre sua."
              },
              {
                q: "Posso contratar e demonstrar interesse em projetos?",
                a: "Sim. Contas com acesso à publicação também podem demonstrar interesse em oportunidades de outras pessoas. Não é permitido demonstrar interesse no próprio projeto."
              }
            ].map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <ChevronDown size={18} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="landing-container final-cta-wrap">
          <div data-reveal className="final-cta">
            <span className="eyebrow">O FUTURO SE CONSTRÓI EM REDE</span>
            <h2>
              A próxima conexão
              <br />
              pode mudar tudo.
            </h2>
            <Link href="/register" className="marketing-button lime-button">
              Faça parte da Synapse <ArrowUpRight size={20} />
            </Link>
            <div className="cta-orbit" aria-hidden="true" />
          </div>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <div>
          <Brand />
          <p>Conectando experiência e possibilidade.</p>
        </div>
        <nav aria-label="Links do rodapé">
          <a href="#plataforma">A plataforma</a>
          <Link href="/login">Entrar</Link>
          <Link href="/register">
            Criar conta <ArrowRight size={15} />
          </Link>
        </nav>
        <span>© {new Date().getFullYear()} Synapse</span>
      </footer>
    </div>
  )
}
