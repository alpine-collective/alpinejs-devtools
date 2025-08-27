const ALPHA_FEATURES = {
  history: {
    surveyLink: 'https://tally.so/r/mJxevK',
    featureName: 'History',
  },
} as const;
interface AlphaSurveyProps {
  feature: keyof typeof ALPHA_FEATURES;
}
export function AlphaSurveyLink({ feature }: AlphaSurveyProps) {
  const featureDef = ALPHA_FEATURES[feature];
  return (
    <a
      class="text-xs hover:underline text-gray-500"
      onClick={(e) => {
        e.stopPropagation();
      }}
      href={featureDef.surveyLink}
      target="_blank"
      data-tooltip={`${featureDef.featureName} is in alpha, click to provide your feedback`}
      data-side="left"
    >
      (alpha)
    </a>
  );
}
