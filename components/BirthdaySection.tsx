import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';
import { BirthdayPerson } from '../data/birthdayPeople';

interface BirthdaySectionProps {
    birthdayPeople: {
        person: BirthdayPerson;
        movies: Movie[];
    }[];
    onPersonPress: (personId: number) => void;
    onMoviePress: (movie: Movie) => void;
}

export const BirthdaySection: React.FC<BirthdaySectionProps> = ({
    birthdayPeople,
    onPersonPress,
    onMoviePress,
}) => {
    if (birthdayPeople.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>HAPPY BIRTHDAY</Text>
            {birthdayPeople.map(({ person, movies }) => (
                <View key={person.id} style={styles.personCard}>
                    <TouchableOpacity
                        style={styles.personHeader}
                        onPress={() => onPersonPress(person.id)}
                    >
                        <View style={styles.personInfo}>
                            <Text style={styles.personName}>{person.nameJa}</Text>
                            <Text style={styles.personEnglishName}>{person.name}</Text>
                            <View style={styles.personMeta}>
                                <Text style={styles.personType}>
                                    {person.type === 'director' ? '監督' : '俳優'}
                                </Text>
                                {person.knownFor && (
                                    <Text style={styles.knownFor}>
                                        代表作: {person.knownFor}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>

                    {movies.length > 0 && (
                        <View style={styles.filmographyContainer}>
                            <Text style={styles.filmographyLabel}>FILMOGRAPHY</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.moviesScroll}
                                contentContainerStyle={styles.moviesContent}
                            >
                                {movies.map((movie) => (
                                    <TouchableOpacity
                                        key={movie.id}
                                        style={styles.movieItem}
                                        onPress={() => onMoviePress(movie)}
                                    >
                                        {movie.poster_path && (
                                            <Image
                                                source={{ uri: getImageUrl(movie.poster_path, 'w185') || '' }}
                                                style={styles.poster}
                                            />
                                        )}
                                        <Text style={styles.movieTitle} numberOfLines={1}>
                                            {movie.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    personCard: {
        backgroundColor: Colors.light.surface,
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    personHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 2,
    },
    personEnglishName: {
        fontSize: 12,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    personMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    personType: {
        fontSize: 11,
        color: Colors.light.accent,
        backgroundColor: Colors.light.accent + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    knownFor: {
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    arrowIcon: {
        fontSize: 24,
        color: Colors.light.textMuted,
    },
    filmographyContainer: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        paddingTop: 12,
    },
    filmographyLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    moviesScroll: {
        // marginTop handled by filmographyContainer
    },
    moviesContent: {
        gap: 12,
    },
    movieItem: {
        width: 70,
        alignItems: 'center',
    },
    poster: {
        width: 70,
        height: 105,
        borderRadius: 6,
        marginBottom: 4,
    },
    movieTitle: {
        fontSize: 10,
        color: Colors.light.text,
        textAlign: 'center',
    },
});
