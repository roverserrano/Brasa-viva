import { PublicLink } from '../../components/site/public-link';
import { SiteIcon } from '../../components/site/site-icon';

const steps = [
  { icon: 'pin', title: 'Tu sucursal', text: 'Elige la que te queda mejor y descubre su menú.' },
  {
    icon: 'bag',
    title: 'Tu antojo',
    text: 'Añade tus favoritos. Revisa cantidades y datos antes de confirmar.'
  },
  {
    icon: 'chat',
    title: 'Tu próximo buen momento',
    text: 'Registramos tu pedido y continúas con la sucursal por WhatsApp.'
  }
] as const;
const questions = [
  [
    '¿Necesito una cuenta para pedir?',
    'No. Elige tu sucursal, añade al carrito e ingresa tu nombre y teléfono al confirmar.'
  ],
  [
    '¿Puedo recogerlo o pedir delivery?',
    'Elige recojo o delivery según los servicios de tu sucursal. El costo y los detalles de entrega se coordinan por WhatsApp.'
  ],
  [
    '¿Cuándo se confirma el precio?',
    'Antes de registrar comprobamos precios y promociones. Recibirás el total confirmado y tu código de pedido antes de continuar por WhatsApp.'
  ]
];

export function OrderingGuide() {
  return (
    <section className="public-container public-section" aria-labelledby="steps-title">
      <div className="public-centered-heading">
        <p className="public-eyebrow">MENOS VUELTAS. MÁS SABOR.</p>
        <h2 id="steps-title" className="public-display">
          Tan fácil como
          <br />
          <em>tener ganas.</em>
        </h2>
      </div>
      <ol className="home-steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <div className="home-step-top">
              <span className="home-step-icon">
                <SiteIcon name={step.icon} />
              </span>
              <span>0{index + 1}</span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="home-steps-action">
        <PublicLink className="public-text-link" href="/menu">
          Vamos a elegir <SiteIcon name="arrow" />
        </PublicLink>
        <p>Sin cuenta de cliente. El total se confirma al registrar el pedido.</p>
      </div>
    </section>
  );
}

export function HomeQuestions() {
  return (
    <section className="public-container public-section home-faq" aria-labelledby="questions-title">
      <div>
        <p className="public-eyebrow">TODO CLARO ANTES DEL PRIMER BOCADO</p>
        <h2 id="questions-title" className="public-display">
          Tú pregunta.
          <br />
          <em>Nosotros te guiamos.</em>
        </h2>
        <PublicLink className="public-text-link" href="/contacto">
          Hablemos <SiteIcon name="arrow" />
        </PublicLink>
      </div>
      <div>
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
