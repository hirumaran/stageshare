import { IntroBootAnimation } from './IntroBootAnimation';

type ClioBootAnimationProps = {
  onFinish: () => void;
};

export function ClioBootAnimation({ onFinish }: ClioBootAnimationProps) {
  console.log('[clio-boot-animation] rendering shader-backed ClioBootAnimation');

  return <IntroBootAnimation onFinish={onFinish} />;
}
