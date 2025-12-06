interface InterviewQuestionsProps {
  questions: string[]
}

export default function InterviewQuestions({ questions }: InterviewQuestionsProps) {
  return (
    <div className="bg-[#0f1629] rounded-xl border border-gray-800 p-6 mb-8">
      <h2 className="text-xl font-bold text-white mb-6">Recommended Interview Questions</h2>
      <div className="space-y-4">
        {questions.map((question, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
              {idx + 1}
            </div>
            <p className="text-gray-300 pt-0.5">{question}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
