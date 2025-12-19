import React, {useState} from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
    {
        question: "Is my candidate data stored permanently?",
        answer: "Your candidate data stays in your account until you decide to delete it. You're in complete control - delete individual candidates anytime from their profile page, or remove all your data by deleting your account. If you're a recruiter, you'll only see candidates you've added. Admins can view all candidates in the system."
      },
      {
        question: "How is the Role Fit Score calculated?",
        answer: "Think of it as a smart matching system! Our AI looks at how well a candidate's skills, experience, and education align with your job requirements. It understands that 'React' and 'ReactJS' are the same thing, considers whether someone is junior or senior level, and gives you a score out of 100 to show how good the match is."
      },
      {
        question: "What is the Confidence Score?",
        answer: "The Confidence Score tells you how reliable the evaluation is. It's based on two things: whether we have complete information (skills, experience, and education), and whether any red flags were detected during analysis. A score of 100 means we have all the info we need and everything looks good!"
      },
      {
        question: "Does this replace the recruiter?",
        answer: "Not at all! TalentScan AI is your assistant, not your replacement. We handle the time-consuming parts like reading through resumes and initial screening, so you can focus on what humans do best - building relationships, assessing culture fit, and making those final hiring decisions."
      },
      {
        question: "What file formats can I upload?",
        answer: "We accept PDF and Word documents (DOCX) for resume uploads. You can also paste a LinkedIn profile URL and we'll automatically pull in and analyze the candidate's information - no manual copying needed!"
      },
      {
        question: "How does bias detection work?",
        answer: "Our AI keeps an eye out for potential bias in evaluations and flags anything concerning. It focuses purely on skills, experience, and qualifications - not personal characteristics. If something seems off (like a mismatch between the job and candidate), it'll adjust the confidence score to let you know."
      }
]

const FAQ = () => { 
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }
  return (
    <section className='bg-white py-16 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-8'>Frequently Asked Questions</h2>
            <p className='text-lg text-gray-600 text-center mb-12'>Everything you need to know about TalentScan AI</p>
            <div className='space-y-4'>
                {faqs.map((faq, index) => (
                    <div key={index} className='border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors'>
                        <button className='flex justify-between items-center w-full p-5 text-left bg-white hover:bg-gray-50 transition-colors focus:outline-none' onClick={() => toggleFAQ(index)}>
                            <h3 className='text-lg font-semibold pr-4'>{faq.question}</h3>
                            <ChevronDown className={`w-6 h-6 flex-shrink-0 transition-transform duration-200 ${openIndex === index ? 'transform rotate-180' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                            <p className='p-5 pt-0 text-gray-600'>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  )
}

export default FAQ