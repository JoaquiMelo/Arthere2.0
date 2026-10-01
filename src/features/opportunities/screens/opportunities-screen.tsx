import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { candidatarProjeto, criarProjeto, listarProjetos, obterSessao, Projeto } from '@/services/api';
import { colors } from '@/shared/theme/colors';

export default function OpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tipo, setTipo] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [orcamento, setOrcamento] = useState('');

  const carregar = async () => {
    try {
      setCarregando(true);
      const [lista, sessao] = await Promise.all([listarProjetos(), obterSessao()]);
      setProjetos(lista);
      setTipo(sessao?.usuario.tipo ?? null);
    } catch (error) {
      Alert.alert(
        'Não foi possível carregar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregar();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const candidatar = async (projeto: Projeto) => {
    try {
      await candidatarProjeto(projeto.id);
      Alert.alert('Candidatura enviada!', 'O contratante poderá analisar seu perfil.');
    } catch (error) {
      Alert.alert(
        'Não foi possível candidatar-se',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    }
  };

  const publicar = async () => {
    if (!titulo.trim() || !descricao.trim() || !categoria.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha título, descrição e categoria.');
      return;
    }

    try {
      await criarProjeto({
        titulo,
        descricao,
        categoria,
        orcamento: orcamento ? Number(orcamento.replace(',', '.')) : undefined,
      });
      setModalAberto(false);
      setTitulo('');
      setDescricao('');
      setCategoria('');
      setOrcamento('');
      await carregar();
      Alert.alert('Oportunidade publicada!');
    } catch (error) {
      Alert.alert(
        'Não foi possível publicar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>TRABALHO E COLABORAÇÃO</Text>
          <Text style={styles.title}>Oportunidades</Text>
          <Text style={styles.subtitle}>Encontre ou publique novos projetos.</Text>
        </View>

        {tipo === 'CONTRATANTE' ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.manage}
              onPress={() => navigation.navigate('ManageOpportunities')}
              accessibilityLabel="Gerenciar candidaturas"
            >
              <Ionicons name="people-outline" color={colors.brandPaper} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.add}
              onPress={() => setModalAberto(true)}
              accessibilityLabel="Criar oportunidade"
            >
              <Ionicons name="add" color={colors.brandPaper} size={23} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />

      {carregando ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.brandCoral} />
        </View>
      ) : (
        <FlatList
          data={projetos}
          onRefresh={carregar}
          refreshing={carregando}
          keyExtractor={(item) => item.id}
          contentContainerStyle={projetos.length ? styles.list : styles.empty}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={30} color={colors.brandCoral} />
              <Text style={styles.emptyTitle}>Nenhuma oportunidade aberta</Text>
              <Text style={styles.emptyText}>
                Quando novos projetos forem publicados, eles aparecerão aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.category}>{item.categoria}</Text>
                <Ionicons name="arrow-up-outline" size={17} color={colors.brandCoral} />
              </View>

              <Text style={styles.projectTitle}>{item.titulo}</Text>
              <Text style={styles.description}>{item.descricao}</Text>

              <View style={styles.companyRow}>
                <Ionicons name="business-outline" size={14} color={colors.brandTerracotta} />
                <Text style={styles.company}>{item.contratante.empresa || item.contratante.nome}</Text>
              </View>

              <View style={styles.footer}>
                {item.orcamento != null ? (
                  <View>
                    <Text style={styles.budgetLabel}>ORÇAMENTO</Text>
                    <Text style={styles.budget}>R$ {item.orcamento.toFixed(2)}</Text>
                  </View>
                ) : (
                  <Text style={styles.noBudget}>A combinar</Text>
                )}

                {tipo === 'AGENTE' ? (
                  <TouchableOpacity style={styles.apply} onPress={() => candidatar(item)}>
                    <Text style={styles.applyText}>CANDIDATAR-ME</Text>
                    <Ionicons name="arrow-forward" size={15} color={colors.brandPaper} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={modalAberto}
        animationType="slide"
        transparent
        onRequestClose={() => setModalAberto(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalKicker}>PUBLICAR PROJETO</Text>
            <Text style={styles.modalTitle}>Nova oportunidade</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FieldLabel label="Título da vaga *" />
              <TextInput
                style={styles.input}
                placeholder="Ex.: Fotógrafo para evento corporativo"
                placeholderTextColor={colors.muted}
                value={titulo}
                onChangeText={setTitulo}
              />

              <FieldLabel label="Descrição *" />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Descreva o serviço, requisitos e o que espera do profissional."
                placeholderTextColor={colors.muted}
                value={descricao}
                onChangeText={setDescricao}
                multiline
              />

              <FieldLabel label="Categoria *" />
              <TextInput
                style={styles.input}
                placeholder="Ex.: Fotografia, Música, Design..."
                placeholderTextColor={colors.muted}
                value={categoria}
                onChangeText={setCategoria}
              />

              <FieldLabel label="Orçamento" />
              <TextInput
                style={styles.input}
                placeholder="Ex.: 1500,00 (opcional)"
                placeholderTextColor={colors.muted}
                value={orcamento}
                onChangeText={setOrcamento}
                keyboardType="decimal-pad"
              />

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => setModalAberto(false)}>
                  <Text style={styles.cancel}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.publish} onPress={publicar}>
                  <Text style={styles.publishText}>PUBLICAR</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.brandPaper} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandPaper,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: colors.brandPaper,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: colors.brandCoral,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    color: colors.brandInk,
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manage: {
    width: 42,
    height: 42,
    backgroundColor: colors.brandInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 42,
    height: 42,
    backgroundColor: colors.brandCoral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
    paddingTop: 14,
    paddingBottom: 35,
    gap: 14,
  },
  empty: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 26,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.brandInk,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    color: colors.brandCoral,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  projectTitle: {
    color: colors.brandInk,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: 7,
    letterSpacing: -0.3,
  },
  description: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  company: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  budgetLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  budget: {
    color: colors.brandInk,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  noBudget: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  apply: {
    minHeight: 40,
    paddingHorizontal: 12,
    backgroundColor: colors.brandInk,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyText: {
    color: colors.brandPaper,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(41,36,43,0.50)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.brandPaper,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '92%',
    borderTopWidth: 2,
    borderTopColor: colors.brandCoral,
  },
  modalHandle: {
    width: 46,
    height: 4,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 17,
  },
  modalKicker: {
    color: colors.brandCoral,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  modalTitle: {
    color: colors.brandInk,
    fontSize: 23,
    fontWeight: '900',
    marginTop: 4,
    marginBottom: 10,
  },
  fieldLabel: {
    color: colors.brandInk,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
  },
  textarea: {
    minHeight: 106,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 18,
    marginTop: 24,
  },
  cancel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  publish: {
    minHeight: 44,
    paddingHorizontal: 15,
    backgroundColor: colors.brandInk,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  publishText: {
    color: colors.brandPaper,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
});
