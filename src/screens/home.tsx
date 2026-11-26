import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, SafeAreaView, Text, View } from 'react-native';
import { events, projects } from '../services/api';
import { useUser } from '../providers/user-provider';

type FeedItem = {
  id: string;
  kind: 'Projeto' | 'Evento';
  titulo?: string;
  descricao?: string;
  cidade?: string;
};

export default function Home() {
  const { user, logout } = useUser();
  const [projs, setProjs] = useState<any[]>([]);
  const [evts, setEvts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    const task = setTimeout(() => Promise.all([
      projects(user?.cidade ? { cidade: user.cidade } : {}),
      events(user?.cidade ? { cidade: user.cidade } : {}),
    ])
      .then(([projetos, eventos]) => {
        if (!ativo) return;
        setProjs(projetos);
        setEvts(eventos);
      })
      .catch((error) => {
        console.error('Não foi possível carregar o início:', error);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      }), 0);

    return () => {
      ativo = false;
      clearTimeout(task);
    };
  }, [user?.cidade]);

  const itens: FeedItem[] = [
    ...projs.map((item) => ({ ...item, kind: 'Projeto' as const })),
    ...evts.map((item) => ({ ...item, kind: 'Evento' as const })),
  ];

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 26, fontWeight: '800' }}>Arthere</Text>
          <Text>{user?.nome ?? user?.email}</Text>
        </View>
        <Button title="Sair" onPress={logout} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          contentContainerStyle={{ paddingTop: 20, gap: 12 }}
          renderItem={({ item }) => (
            <View style={{ padding: 16, borderWidth: 1, borderRadius: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700' }}>{item.kind}</Text>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>{item.titulo}</Text>
              <Text>{item.descricao}</Text>
              <Text>{item.cidade}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
