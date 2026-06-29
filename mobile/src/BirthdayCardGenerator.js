import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Modal, Alert, ScrollView, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Download, XCircle, Type, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const bpslLogo = require('./assets/BPSL logo.png');

const BIAS_IMAGES = {
    lisa: "https://i.ibb.co/6cjn2p3K/20240314-Lisa-Manoban-07.jpg",
    jennie: "https://i.ibb.co/N2N5tWXC/FI-S-Z7ak-AAFRVy.jpg",
    rose: "https://i.ibb.co/JjMdDydt/Blackpink-Ros-Rimowa-1.jpg",
    jisoo: "https://i.ibb.co/8DM6vjrs/Fg8zt-Qx-WQAE-5c0.jpg",
    ot4: "https://i.ibb.co/qLQD7J9S/b3f41670-7a3c-11f0-a34f-318be3fb0481.jpg"
};

const getBiasImage = (bias) => {
    if (!bias) return null;
    const b = bias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (b.includes('lisa')) return BIAS_IMAGES.lisa;
    if (b.includes('jennie')) return BIAS_IMAGES.jennie;
    if (b.includes('rose') || b.includes('rosé')) return BIAS_IMAGES.rose;
    if (b.includes('jisoo')) return BIAS_IMAGES.jisoo;
    if (b.includes('ot4') || b.includes('all') || b.includes('group')) return BIAS_IMAGES.ot4;
    return null;
};

const BirthdayCardGenerator = ({ member, onClose }) => {
    const [name, setName] = useState(member?.name || 'Name');
    const [age, setAge] = useState(member?.ageTurning?.toString() || 'Age');
    const [isGenerating, setIsGenerating] = useState(false);
    const cardRef = useRef();

    const handleDownload = useCallback(async () => {
        setIsGenerating(true);
        try {
            const uri = await captureRef(cardRef, {
                format: 'jpg',
                quality: 0.9,
                result: 'tmpfile'
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Saved", `Image saved to ${uri}`);
            }
        } catch (err) {
            console.error('Failed to generate image', err);
            Alert.alert("Error", "Failed to generate image");
        } finally {
            setIsGenerating(false);
        }
    }, [name]);

    const biasImageUri = getBiasImage(member?.bias);

    return (
        <Modal animationType="slide" transparent={true} visible={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerText}>GENERATE WISH</Text>
                        <TouchableOpacity onPress={onClose}>
                            <XCircle size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                        {/* PREVIEW SECTION */}
                        <View style={styles.previewSection}>
                            {/* THE CARD TO CAPTURE */}
                            <View
                                ref={cardRef}
                                style={styles.card}
                            >
                                {/* Background Layer */}
                                <View style={styles.cardBackground} />

                                {/* Bias Image Overlay */}
                                {biasImageUri && (
                                    <Image
                                        source={{ uri: biasImageUri }}
                                        style={styles.biasImage}
                                        resizeMode="cover"
                                    />
                                )}

                                {/* Dark Gradient Overlay */}
                                <LinearGradient
                                    colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.6)']}
                                    style={styles.darkOverlay}
                                />

                                {/* Gradients */}
                                <LinearGradient
                                    colors={['rgba(88, 28, 135, 0.3)', 'transparent']}
                                    style={styles.gradientTop}
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(22, 78, 99, 0.2)']}
                                    style={styles.gradientBottom}
                                />

                                {/* Border Frame */}
                                <View style={styles.borderFrame}>
                                    <View style={styles.borderTop} />
                                    <View style={styles.borderBottom} />
                                </View>

                                {/* Content Layer */}
                                <View style={styles.contentLayer}>
                                    {/* Logo */}
                                    <View style={styles.logoContainer}>
                                        <Image source={bpslLogo} style={styles.logo} resizeMode="contain" />
                                    </View>

                                    {/* Main Text */}
                                    <View style={styles.mainTextContainer}>
                                        <Text style={styles.happyBirthdayText}>HAPPY BIRTHDAY</Text>

                                        {/* Name with Gradient */}
                                        <MaskedView
                                            maskElement={
                                                <Text style={styles.nameText}>{name}</Text>
                                            }
                                        >
                                            <LinearGradient
                                                colors={['#ffffff', '#d1d5db']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                            >
                                                <Text style={[styles.nameText, { opacity: 0 }]}>{name}</Text>
                                            </LinearGradient>
                                        </MaskedView>

                                        <View style={styles.ageRow}>
                                            {/* Tapered Left Divider */}
                                            <LinearGradient
                                                colors={['transparent', '#6b7280']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.dividerLeft}
                                            />
                                            <Text style={styles.turningText}>
                                                Turning <Text style={styles.ageNumber}>{age}</Text>
                                            </Text>
                                            {/* Tapered Right Divider */}
                                            <LinearGradient
                                                colors={['#6b7280', 'transparent']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.dividerRight}
                                            />
                                        </View>
                                    </View>

                                    {/* Footer */}
                                    <View style={styles.footer}>
                                        <Text style={styles.footerText}>WISHING YOU A FANTASTIC YEAR AHEAD</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* CONTROLS SECTION */}
                        <View style={styles.controlsSection}>
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabel}>
                                    <Type size={14} color="#06b6d4" />
                                    <Text style={styles.inputLabelText}>RECIPIENT NAME</Text>
                                </View>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    style={styles.input}
                                    placeholder="Enter Name"
                                    placeholderTextColor="#6b7280"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabel}>
                                    <Calendar size={14} color="#06b6d4" />
                                    <Text style={styles.inputLabelText}>TURNING AGE</Text>
                                </View>
                                <TextInput
                                    value={age}
                                    onChangeText={setAge}
                                    style={styles.input}
                                    placeholder="Enter Age"
                                    placeholderTextColor="#6b7280"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleDownload}
                                disabled={isGenerating}
                                style={styles.downloadButton}
                            >
                                {isGenerating ? (
                                    <Text style={styles.downloadButtonText}>GENERATING...</Text>
                                ) : (
                                    <>
                                        <Download size={16} color="#9ca3af" />
                                        <Text style={styles.downloadButtonText}>DOWNLOAD IMAGE</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#111827',
        width: '100%',
        maxWidth: 512,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937',
        flex: 1,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    headerText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '300',
        letterSpacing: 2,
    },
    previewSection: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#000000',
    },
    card: {
        width: 300,
        height: 375,
        backgroundColor: '#050505',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#050505',
    },
    gradientTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    gradientBottom: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '75%',
        height: '75%',
        borderRadius: 999,
    },
    biasImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        opacity: 0.18,
    },
    darkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    borderFrame: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        bottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        zIndex: 10,
    },
    borderTop: {
        position: 'absolute',
        top: -0.5,
        left: '50%',
        transform: [{ translateX: -40 }, { translateY: -0.5 }],
        width: 80,
        height: 1,
        backgroundColor: '#050505',
    },
    borderBottom: {
        position: 'absolute',
        bottom: -0.5,
        left: '50%',
        transform: [{ translateX: -40 }, { translateY: 0.5 }],
        width: 80,
        height: 1,
        backgroundColor: '#050505',
    },
    contentLayer: {
        position: 'relative',
        zIndex: 20,
        paddingHorizontal: 16,
        paddingVertical: 32,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    logoContainer: {
        marginBottom: 16,
    },
    logo: {
        width: 56,
        height: 56,
    },
    mainTextContainer: {
        alignItems: 'center',
    },
    happyBirthdayText: {
        color: '#22d3ee',
        letterSpacing: 4,
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    nameText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 48,
        letterSpacing: 1,
    },
    ageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    dividerLeft: {
        height: 1,
        width: 40,
        backgroundColor: '#6b7280',
    },
    turningText: {
        fontSize: 20,
        fontWeight: '300',
        color: '#ffffff',
        fontStyle: 'italic',
        marginHorizontal: 12,
    },
    ageNumber: {
        color: '#ec4899',
        fontWeight: 'bold',
        fontStyle: 'normal',
    },
    dividerRight: {
        height: 1,
        width: 40,
        backgroundColor: '#6b7280',
    },
    footer: {
        marginTop: 'auto',
    },
    footerText: {
        color: '#6b7280',
        fontSize: 9,
        letterSpacing: 2,
        textAlign: 'center',
    },
    controlsSection: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabelText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#06b6d4',
        letterSpacing: 2,
        marginLeft: 8,
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#ffffff',
        fontSize: 14,
    },
    downloadButton: {
        width: '100%',
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#374151',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    downloadButtonText: {
        color: '#9ca3af',
        fontWeight: '500',
        fontSize: 12,
        letterSpacing: 2,
        marginLeft: 8,
    },
});

export default BirthdayCardGenerator;
