import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSearch, SearchResult } from "../../hooks/useSearch";
import { useProfile } from "../../context/ProfileContext";
import { Search, Users, BookOpen, MessageCircle, Clock, User, Calendar, DollarSign, GraduationCap } from "lucide-react";
import styles from "./SearchPage.module.css";

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { results, loading, error } = useSearch(query, profile?.id);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query.trim());
    }
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    if (window.location.pathname + window.location.search !== newUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [query, navigate]);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'post':
        return <MessageCircle size={20} />;
      case 'course':
        return <BookOpen size={20} />;
      case 'profile':
        return <Users size={20} />;
      default:
        return <Search size={20} />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'post':
        return 'Пост';
      case 'course':
        return 'Курс';
      case 'profile':
        return 'Профиль';
      default:
        return 'Результат';
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'post':
        return '#007aff';
      case 'course':
        return '#34c759';
      case 'profile':
        return '#ff9500';
      default:
        return '#8e8e93';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        // Navigate to posts page and potentially scroll to the specific post
        navigate(`/posts#post-${result.id}`);
        break;
      case 'course':
        navigate(`/course/${result.id}`);
        break;
      case 'profile':
        navigate(`/profile/${result.id}`);
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderMetadata = (result: SearchResult) => {
    if (result.type === 'post') {
      return (
        <div className={styles.metadata}>
          {result.metadata?.likes_count !== undefined && (
            <span className={styles.metaItem}>
              <MessageCircle size={14} />
              {result.metadata.likes_count}
            </span>
          )}
          {result.metadata?.comments_count !== undefined && (
            <span className={styles.metaItem}>
              <MessageCircle size={14} />
              {result.metadata.comments_count}
            </span>
          )}
          {result.createdAt && (
            <span className={styles.metaItem}>
              <Clock size={14} />
              {formatDate(result.createdAt)}
            </span>
          )}
        </div>
      );
    }

    if (result.type === 'course') {
      return (
        <div className={styles.metadata}>
          {result.metadata?.price !== undefined && (
            <span className={styles.metaItem}>
              <DollarSign size={14} />
              {result.metadata.price === 0 ? 'Бесплатно' : `${result.metadata.price} ₽`}
            </span>
          )}
          {result.metadata?.duration && (
            <span className={styles.metaItem}>
              <Clock size={14} />
              {result.metadata.duration}
            </span>
          )}
          {result.metadata?.grades && (
            <span className={styles.metaItem}>
              <GraduationCap size={14} />
              {Array.isArray(result.metadata.grades) ? result.metadata.grades.join(', ') : result.metadata.grades}
            </span>
          )}
        </div>
      );
    }

    if (result.type === 'profile') {
      return (
        <div className={styles.metadata}>
          {result.metadata?.username && (
            <span className={styles.metaItem}>
              <User size={14} />
              @{result.metadata.username}
            </span>
          )}
          {result.createdAt && (
            <span className={styles.metaItem}>
              <Calendar size={14} />
              {formatDate(result.createdAt)}
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.searchPage}>
      <div className={styles.searchContainer}>
        <div className={styles.searchHeader}>
          <h1 className={styles.pageTitle}>Поиск</h1>
          <p className={styles.pageSubtitle}>Найдите посты, курсы и профили</p>
        </div>

        <div className={styles.searchInputContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите поисковый запрос..."
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Поиск...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && query.trim().length >= 2 && (
          <div className={styles.resultsContainer}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                {results.length} {results.length === 1 ? 'результат' : results.length < 5 ? 'результата' : 'результатов'}
              </h2>
            </div>

            {results.length === 0 ? (
              <div className={styles.emptyState}>
                <Search size={48} className={styles.emptyIcon} />
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить поисковый запрос</p>
              </div>
            ) : (
              <div className={styles.resultsList}>
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={styles.resultItem}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className={styles.resultHeader}>
                      <div className={styles.resultType} style={{ color: getTypeColor(result.type) }}>
                        {getTypeIcon(result.type)}
                        <span>{getTypeLabel(result.type)}</span>
                      </div>
                      {result.author && (
                        <div className={styles.resultAuthor}>
                          {result.authorAvatar && (
                            <img
                              src={result.authorAvatar.startsWith('http') ? result.authorAvatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${result.authorAvatar}`}
                              alt={result.author}
                              className={styles.authorAvatar}
                            />
                          )}
                          <span>{result.author}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.resultContent}>
                      <h3 className={styles.resultTitle}>{result.title}</h3>
                      {result.description && (
                        <p className={styles.resultDescription}>{result.description}</p>
                      )}
                    </div>

                    {renderMetadata(result)}

                    {result.imageUrl && (
                      <div className={styles.resultImage}>
                        <img
                          src={result.imageUrl.startsWith('http') ? result.imageUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${result.imageUrl}`}
                          alt={result.title}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !error && query.trim().length < 2 && (
          <div className={styles.initialState}>
            <Search size={48} className={styles.initialIcon} />
            <h3>Начните поиск</h3>
            <p>Введите минимум 2 символа для поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
