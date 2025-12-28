import { IonButton, IonIcon } from '@ionic/react';
import ai from '../../../../assets/ai.jpg';

import './style.css';

import { happyOutline, ellipsisHorizontalOutline, readerOutline } from 'ionicons/icons';

import { useMutation } from '@tanstack/react-query';
import { getChatEmotions, getChatSummary } from '../../../../services/openAi';
import { useState } from 'react';

interface AiTools {
	chatId: string;
}

const AiTools = ({ chatId }: AiTools) => {
	const [summaryText, setSummaryText] = useState<string>();
	const [emotionText, setEmotionText] = useState<any>();

	const { mutate: mutateSummary, isLoading: summaryIsLoading } = useMutation({
		mutationFn: ({ chatId }: any) => getChatSummary(chatId),
	});

	const { mutate: mutateEmotions, isLoading: emotionsIsLoading } = useMutation({
		mutationFn: ({ chatId }: any) => getChatEmotions(chatId),
	});

	const getSummary = () => {
		mutateSummary(
			{ chatId },
			{
				onSuccess: (data) => {
					// console.log('Chat Summary:', data);
					setSummaryText(data.result);
				},
				onError: (error) => {
					console.error('Error fetching chat summary:', error);
				},
			}
		);
	};

	const getEmotions = () => {
		mutateEmotions(
			{ chatId },
			{
				onSuccess: (data) => {
					setEmotionText(data.result);
					// setText(data.result);
					console.log(emotionText);
				},
				onError: (error) => {
					console.error('Error fetching chat emotions:', error);
				},
			}
		);
	};

	return (
		<div className="ai-options">
			<div className="ai-output">
				{summaryText ? (
					<div className="ai-card">
						<div className="ai-header">
							<span className="ai-badge">Summary</span>
						</div>
						<p className="ai-paragraph">{summaryText}</p>
					</div>
				) : emotionText ? (
					<div className="ai-card">
						<div className="ai-header">
							<span className="ai-badge">Tone</span>
							<span className="ai-title">{emotionText.overall_mood}</span>
						</div>

						{emotionText.explanation && <p className="ai-explanation">{emotionText.explanation}</p>}

						<div className="ai-chips">
							{emotionText.emotions?.map((e: string) => (
								<span key={e} className="ai-chip">
									{e}
								</span>
							))}
						</div>
					</div>
				) : (
					<img src={ai} className="ai-image" />
				)}
			</div>

			<IonButton onClick={() => getSummary()}>
				<span>
					<span className="btn-text">Get Chat Summary</span>
					<IonIcon
						icon={summaryIsLoading ? ellipsisHorizontalOutline : readerOutline}
						style={{
							margin: '0 auto',
							color: 'white',
						}}
					/>
				</span>
			</IonButton>
			<IonButton onClick={() => getEmotions()}>
				<span>
					<span className="btn-text">Emotion Analysis</span>
					<IonIcon
						icon={emotionsIsLoading ? ellipsisHorizontalOutline : happyOutline}
						style={{
							margin: '0 auto',
							color: 'white',
						}}
					/>
				</span>
			</IonButton>
		</div>
	);
};

export default AiTools;
