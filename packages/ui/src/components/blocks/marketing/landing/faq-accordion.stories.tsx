import type { Meta, StoryObj } from '@storybook/react'
import { FAQAccordion } from './faq-accordion'

const meta: Meta<typeof FAQAccordion> = {
  title: 'Blocks/Marketing/Landing/FAQAccordion',
  component: FAQAccordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FAQAccordion>

const sampleItems = [
  {
    question: 'What is the pricing model?',
    answer:
      'We offer a flexible pricing model that scales with your needs. Our plans start at $29/month for individuals and go up to enterprise-level pricing for larger organizations. All plans include core features, with additional features available in higher tiers.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'Yes, we offer a 14-day free trial on all our paid plans. No credit card is required to start your trial. You can upgrade, downgrade, or cancel at any time during or after your trial period.',
  },
  {
    question: 'What kind of support do you provide?',
    answer:
      'We provide 24/7 support through email, live chat, and phone for all paid plans. Our support team consists of technical experts who can help you with any questions or issues you may have. We also maintain comprehensive documentation and a knowledge base.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer:
      "Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access to your plan until the end of your current billing period. We don't offer refunds for partial months, but you won't be charged for the next billing cycle.",
  },
  {
    question: 'Is my data secure?',
    answer:
      "We take security very seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and regularly undergo security audits. We're also compliant with major security standards and regulations.",
  },
]

export const Default: Story = {
  args: {
    title: 'Frequently asked questions',
    description: 'Find answers to common questions about our product and services',
    items: sampleItems,
  },
}

export const WithoutTitle: Story = {
  args: {
    items: sampleItems,
  },
}

export const WithoutDescription: Story = {
  args: {
    title: 'Frequently asked questions',
    items: sampleItems,
  },
}

export const DefaultOpen: Story = {
  args: {
    title: 'Frequently asked questions',
    description: 'Find answers to common questions about our product and services',
    items: sampleItems,
    defaultOpenIndex: 0,
  },
}

export const LongQuestions: Story = {
  args: {
    title: 'Frequently asked questions',
    description: 'Find answers to common questions about our product and services',
    items: [
      {
        question:
          'What are the detailed pricing plans and what features are included in each tier?',
        answer:
          'We offer a flexible pricing model that scales with your needs. Our plans start at $29/month for individuals and go up to enterprise-level pricing for larger organizations. All plans include core features, with additional features available in higher tiers.',
      },
      {
        question:
          'How does the free trial work and what are the limitations during the trial period?',
        answer:
          'Yes, we offer a 14-day free trial on all our paid plans. No credit card is required to start your trial. You can upgrade, downgrade, or cancel at any time during or after your trial period.',
      },
      {
        question: 'What types of support channels are available and what are the response times?',
        answer:
          'We provide 24/7 support through email, live chat, and phone for all paid plans. Our support team consists of technical experts who can help you with any questions or issues you may have. We also maintain comprehensive documentation and a knowledge base.',
      },
      {
        question:
          'What is the cancellation policy and are there any penalties for early termination?',
        answer:
          "Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access to your plan until the end of your current billing period. We don't offer refunds for partial months, but you won't be charged for the next billing cycle.",
      },
      {
        question: 'What security measures are in place to protect user data and ensure compliance?',
        answer:
          "We take security very seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and regularly undergo security audits. We're also compliant with major security standards and regulations.",
      },
    ],
  },
}

export const LongAnswers: Story = {
  args: {
    title: 'Frequently asked questions',
    description: 'Find answers to common questions about our product and services',
    items: [
      {
        question: 'What is the pricing model?',
        answer:
          'We offer a flexible pricing model that scales with your needs. Our plans start at $29/month for individuals and go up to enterprise-level pricing for larger organizations. All plans include core features, with additional features available in higher tiers. Our pricing is designed to be transparent and predictable, with no hidden fees or surprise charges. We also offer volume discounts for larger organizations and special pricing for educational institutions and non-profits. Contact our sales team for custom pricing options if you have specific requirements.',
      },
      {
        question: 'Do you offer a free trial?',
        answer:
          "Yes, we offer a 14-day free trial on all our paid plans. No credit card is required to start your trial. You can upgrade, downgrade, or cancel at any time during or after your trial period. During the trial, you'll have access to all features of the plan you choose, allowing you to fully evaluate our product. Our team is available to help you get started and answer any questions you may have during your trial. At the end of the trial, you can choose to continue with a paid plan or your account will automatically convert to a free tier with limited features.",
      },
      {
        question: 'What kind of support do you provide?',
        answer:
          'We provide 24/7 support through email, live chat, and phone for all paid plans. Our support team consists of technical experts who can help you with any questions or issues you may have. We also maintain comprehensive documentation and a knowledge base. Our support team is trained to handle both technical and non-technical questions, and we pride ourselves on our quick response times. For enterprise customers, we offer dedicated support representatives and priority response times. We also provide regular training sessions and webinars to help you get the most out of our platform.',
      },
      {
        question: 'Can I cancel my subscription?',
        answer:
          "Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access to your plan until the end of your current billing period. We don't offer refunds for partial months, but you won't be charged for the next billing cycle. To cancel, simply go to your account settings and click the 'Cancel Subscription' button. You'll be asked to confirm your decision, and you can provide feedback about why you're leaving. We use this feedback to improve our product and service. After cancellation, your data will be retained for 30 days in case you want to reactivate your account.",
      },
      {
        question: 'Is my data secure?',
        answer:
          "We take security very seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and regularly undergo security audits. We're also compliant with major security standards and regulations. Our security measures include: end-to-end encryption, regular security audits, penetration testing, data backup and recovery procedures, access controls and authentication, and compliance with GDPR, HIPAA, and other relevant regulations. We also have a dedicated security team that monitors our systems 24/7 and responds to any potential threats immediately.",
      },
    ],
  },
}

export const ManyItems: Story = {
  args: {
    title: 'Frequently asked questions',
    description: 'Find answers to common questions about our product and services',
    items: [
      ...sampleItems,
      {
        question: 'Do you offer custom integrations?',
        answer:
          'Yes, we offer custom integrations with popular tools and services. Our API is well-documented and we provide SDKs for major programming languages. For enterprise customers, we can develop custom integrations to meet specific requirements.',
      },
      {
        question: 'What are the system requirements?',
        answer:
          'Our platform is web-based and works on all modern browsers. We recommend using the latest version of Chrome, Firefox, Safari, or Edge. For mobile access, we have native apps for iOS and Android.',
      },
      {
        question: 'How often do you release updates?',
        answer:
          'We release minor updates and bug fixes weekly, with major feature releases every quarter. All updates are thoroughly tested and documented. We notify users in advance of any major changes.',
      },
      {
        question: 'Can I export my data?',
        answer:
          'Yes, you can export your data at any time in various formats including CSV, JSON, and PDF. We also provide APIs for programmatic access to your data. Data exports are available for all paid plans.',
      },
      {
        question: 'Do you offer training?',
        answer:
          'Yes, we offer comprehensive training for all users. This includes onboarding sessions, regular webinars, and custom training for teams. We also maintain a library of video tutorials and documentation.',
      },
    ],
  },
}
