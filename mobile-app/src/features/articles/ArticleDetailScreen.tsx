import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../theme/tokens';
import { ArrowLeftIcon } from '../../components/icons/AuthIcons';
import {
  ARTICLES_REGISTRY,
  DEFAULT_ARTICLE_ID,
  type ArticleData,
} from './article_types';

export interface ArticleDetailScreenProps {
  articleId?: string | null;
  article?: ArticleData;
  onBack?: () => void;
  onBook?: () => void;
}

export const ArticleDetailScreen: React.FC<ArticleDetailScreenProps> = ({
  articleId,
  article,
  onBack,
  onBook,
}) => {
  const insets = useSafeAreaInsets();
  const activeArticle =
    article ||
    (articleId && ARTICLES_REGISTRY[articleId]) ||
    ARTICLES_REGISTRY[DEFAULT_ARTICLE_ID];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="article-detail-screen">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          testID="article-detail-back-button"
          accessibilityRole="button"
          accessibilityLabel="Назад"
        >
          <ArrowLeftIcon color={colors.terracotta} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Порада експерта
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.articleTitle}>{activeArticle.title}</Text>
        <Text style={styles.introText}>{activeArticle.intro}</Text>

        {activeArticle.sections.map((section, sIndex) => (
          <View key={sIndex} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, iIndex) => (
              <View key={iIndex} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Висновок</Text>
          <Text style={styles.summaryText}>{activeArticle.summary}</Text>
        </View>

        {onBook && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={onBook}
            activeOpacity={0.9}
            testID="article-quick-book-button"
            accessibilityRole="button"
            accessibilityLabel="Записатись на догляд"
          >
            <Text style={styles.bookButtonText}>Записатись на догляд</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236, 100, 58, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentDark,
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.contentDark,
    lineHeight: 30,
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    color: colors.contentDark,
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.9,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listBullet: {
    fontSize: 16,
    color: colors.terracotta,
    marginRight: 10,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: colors.contentDark,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: colors.softIce,
    borderRadius: radii.md,
    padding: 18,
    marginTop: 8,
    marginBottom: 28,
    borderLeftWidth: 4,
    borderLeftColor: colors.terracotta,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: colors.contentDark,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bookButtonText: {
    color: colors.surfaceWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ArticleDetailScreen;
