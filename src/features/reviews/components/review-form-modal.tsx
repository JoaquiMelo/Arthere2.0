import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { StarRating } from './star-rating';

interface Props {
  visible: boolean;
  agenteNome: string;
  onClose: () => void;
  onSubmit: (dados: { nota: number; comentario: string }) => void;
}

export function ReviewFormModal({ visible, agenteNome, onClose, onSubmit }: Props) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  const enviar = () => {
    if (!nota) { Alert.alert('Dê uma nota', 'Escolha de 1 a 5 estrelas.'); return; }
    onSubmit({ nota, comentario });
    setNota(5);
    setComentario('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Avaliar {agenteNome}</Text>
          <Text style={styles.label}>Como foi o serviço?</Text>
          <StarRating value={nota} size={32} onChange={setNota} />
          <Text style={styles.label}>Comentário (opcional)</Text>
          <TextInput style={styles.input} value={comentario} onChangeText={setComentario} placeholder="Conte como foi a experiência" placeholderTextColor={colors.muted} multiline textAlignVertical="top" />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submit} onPress={enviar}><Text style={styles.submitText}>Enviar avaliação</Text></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, padding: 22, paddingBottom: 30, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 14 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  input: { minHeight: 90, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, color: colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 22 },
  cancel: { color: colors.muted, fontWeight: '700' },
  submit: { backgroundColor: colors.primaryDark, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  submitText: { color: colors.white, fontWeight: '800' },
});
