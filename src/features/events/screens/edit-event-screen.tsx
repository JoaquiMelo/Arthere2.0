import { useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { EventPublicationForm } from '../components/event-publication-form';

export default function EditEventScreen() {
  const { params: { eventId } } = useRoute<RouteProp<RootStackParamList, 'EditEvent'>>();
  return <EventPublicationForm key={eventId} eventId={eventId} />;
}
