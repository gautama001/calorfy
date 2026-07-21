import { useTranslation } from 'react-i18next';

import { LegalScreen, LegalSection } from '@/components/LegalScreen';

const copy = {
  en: {
    updated: 'Effective July 21, 2026', intro: 'This policy explains how Calorfy handles personal information when you use the app.',
    collected: 'Information we process', collectedBody: 'Account data (email and user ID); profile and health-related data you enter (weight, height, age, sex, goals and dietary preferences); meals, nutrition records and plans; and app preferences. When you choose AI meal analysis, the selected image is sent for processing.',
    use: 'How we use it', useBody: 'We use this information to authenticate you, calculate nutrition estimates, keep your diary and progress history, create plans, analyze meals you request and maintain app security. Calorfy does not sell personal data or use third-party advertising trackers.',
    providers: 'Service providers', providersBody: 'Supabase provides authentication, database, storage and server functions. Clarifai and Edamam process meal-analysis requests. These providers receive only the information needed to provide their service. Selected meal images are not intentionally retained by Calorfy after the analysis response.',
    retention: 'Retention and deletion', retentionBody: 'Your account data remains while your account is active. You can permanently delete the account and associated profile, meals, weight history, plans and stored images from Settings → Account → Delete account. Some limited records may be retained when legally required or for fraud prevention.',
    rights: 'Your choices', rightsBody: 'You can edit profile and nutrition information in the app, choose whether to submit an image, sign out, or delete your account. Camera and photo access are requested only when you use those features and can be revoked in iOS Settings.',
    safety: 'Health information', safetyBody: 'Calorfy provides estimates for general wellness and is not a medical device. It does not diagnose, treat or replace professional medical or nutrition advice.',
    contact: 'Contact', contactBody: 'For privacy questions or requests, open Help and support in Settings or visit the Calorfy support page.',
  },
  es: {
    updated: 'Vigente desde el 21 de julio de 2026', intro: 'Esta política explica cómo Calorfy trata la información personal cuando usás la app.',
    collected: 'Información que procesamos', collectedBody: 'Datos de cuenta (correo e identificador); datos de perfil y relacionados con salud que ingresás (peso, altura, edad, sexo, objetivos y preferencias alimentarias); comidas, registros nutricionales, planes y preferencias de la app. Si elegís el análisis con IA, la imagen seleccionada se envía para procesarla.',
    use: 'Cómo la usamos', useBody: 'La usamos para autenticarte, calcular estimaciones nutricionales, conservar tu diario y progreso, crear planes, analizar las comidas que solicites y proteger la app. Calorfy no vende datos personales ni utiliza rastreadores publicitarios de terceros.',
    providers: 'Proveedores de servicio', providersBody: 'Supabase brinda autenticación, base de datos, almacenamiento y funciones de servidor. Clarifai y Edamam procesan las solicitudes de análisis de comidas. Reciben únicamente la información necesaria para prestar su servicio. Calorfy no conserva intencionalmente las imágenes elegidas después de responder el análisis.',
    retention: 'Conservación y eliminación', retentionBody: 'Los datos permanecen mientras tu cuenta esté activa. Podés eliminar permanentemente la cuenta y el perfil, comidas, historial de peso, planes e imágenes guardadas desde Ajustes → Cuenta → Eliminar cuenta. Podrían conservarse registros limitados si la ley lo exige o para prevenir fraude.',
    rights: 'Tus opciones', rightsBody: 'Podés editar la información de perfil y nutrición, decidir si enviás una imagen, cerrar sesión o eliminar la cuenta. La cámara y las fotos se solicitan solo cuando usás esas funciones y podés revocar los permisos desde Ajustes de iOS.',
    safety: 'Información de salud', safetyBody: 'Calorfy ofrece estimaciones para bienestar general y no es un dispositivo médico. No diagnostica, trata ni reemplaza asesoramiento médico o nutricional profesional.',
    contact: 'Contacto', contactBody: 'Para consultas o solicitudes de privacidad, abrí Ayuda y soporte en Ajustes o visitá la página de soporte de Calorfy.',
  },
  pt: {
    updated: 'Vigente desde 21 de julho de 2026', intro: 'Esta política explica como o Calorfy trata informações pessoais quando você usa o app.',
    collected: 'Informações que processamos', collectedBody: 'Dados da conta (e-mail e identificador); dados de perfil e relacionados à saúde inseridos por você (peso, altura, idade, sexo, metas e preferências alimentares); refeições, registros nutricionais, planos e preferências do app. Ao escolher a análise por IA, a imagem selecionada é enviada para processamento.',
    use: 'Como usamos', useBody: 'Usamos essas informações para autenticar você, calcular estimativas nutricionais, manter seu diário e progresso, criar planos, analisar refeições solicitadas e proteger o app. O Calorfy não vende dados pessoais nem usa rastreadores de publicidade de terceiros.',
    providers: 'Prestadores de serviço', providersBody: 'Supabase fornece autenticação, banco de dados, armazenamento e funções de servidor. Clarifai e Edamam processam solicitações de análise de refeições. Eles recebem apenas as informações necessárias. O Calorfy não retém intencionalmente as imagens selecionadas após responder à análise.',
    retention: 'Retenção e exclusão', retentionBody: 'Os dados permanecem enquanto sua conta estiver ativa. Você pode excluir permanentemente a conta e perfil, refeições, histórico de peso, planos e imagens armazenadas em Ajustes → Conta → Excluir conta. Registros limitados podem ser mantidos quando exigido por lei ou para prevenir fraude.',
    rights: 'Suas escolhas', rightsBody: 'Você pode editar informações de perfil e nutrição, decidir se envia uma imagem, sair ou excluir a conta. Câmera e fotos são solicitadas apenas quando você usa essas funções e os acessos podem ser revogados nos Ajustes do iOS.',
    safety: 'Informações de saúde', safetyBody: 'O Calorfy oferece estimativas de bem-estar geral e não é um dispositivo médico. Não diagnostica, trata ou substitui orientação médica ou nutricional profissional.',
    contact: 'Contato', contactBody: 'Para dúvidas ou solicitações de privacidade, abra Ajuda e suporte nos Ajustes ou visite a página de suporte do Calorfy.',
  },
};

export default function PrivacyScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : i18n.resolvedLanguage?.startsWith('pt') ? 'pt' : 'es';
  const c = copy[language];
  return <LegalScreen title={t('privacy_policy')} updated={c.updated}><LegalSection title="Calorfy">{c.intro}</LegalSection><LegalSection title={c.collected}>{c.collectedBody}</LegalSection><LegalSection title={c.use}>{c.useBody}</LegalSection><LegalSection title={c.providers}>{c.providersBody}</LegalSection><LegalSection title={c.retention}>{c.retentionBody}</LegalSection><LegalSection title={c.rights}>{c.rightsBody}</LegalSection><LegalSection title={c.safety}>{c.safetyBody}</LegalSection><LegalSection title={c.contact}>{c.contactBody}</LegalSection></LegalScreen>;
}
