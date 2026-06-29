import React, { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Users,
  Edit3,
  Cake,
  Settings,
  Search,
  Phone,
  ArrowRight,
  Loader,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Gift,
  Sparkles,
  LayoutDashboard,
  Wand2,
  UserPlus,
  Check,
  Save,
  MessageSquare,
  Star,
  XCircle,
  Send,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BirthdayCardGenerator from './src/BirthdayCardGenerator';

// --- MOCK DATA (Fallback) ---
const MOCK_DATA = [
  { id: 2, name: "Anjala Botejue", phone: "0714545776", status: "In Group", dateAdded: "2023-10-01", birthday: "1990-10-02", bias: "Lisa", score: 5, comments: "Active member" },
  { id: 3, name: "Hashan Perera", phone: "0714500000", status: "Removed", dateAdded: "2023-10-05", birthday: "1995-10-02", bias: "Jennie", score: 2, comments: "Removed due to inactivity" },
  { id: 4, name: "Kamal Gunaratne", phone: "0771234567", status: "No Response", dateAdded: "2023-09-28", birthday: "1988-12-15", bias: "Rose", score: 3, comments: "No reply yet" },
  { id: 5, name: "Nimali Silva", phone: "0709988776", status: "Not Contacted", dateAdded: "2023-10-06", birthday: "1992-05-20", bias: "Jisoo", score: 4, comments: "To be contacted" },
  { id: 6, name: "Dilshan M", phone: "0711111111", status: "In Group", dateAdded: "2023-01-01", birthday: "1994-01-15", bias: "OT4", score: 1, comments: "Low score" },
];

// --- CONFIGURATION ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMDTDpuTGNZlFuKBdmqbAbdEFzUDgWqNG4QXWNVqb4g-cXv_PISguKITFZxhLZ5jMTtw/exec";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DEFAULT_PROMPTS = {
  initialMessage: "Hi, I'm {{Name}} one of the admins of BPSL Community. Did you fill the form to be added to the community?",
  categories: [
    {
      id: 'cat_1',
      name: 'Blackpink',
      questions: ['What is your favorite Blackpink song?', 'Who is your bias?']
    },
    {
      id: 'cat_2',
      name: 'Jisoo',
      questions: ['Have you watched Snowdrop?', 'Favorite Jisoo solo moment?']
    },
    {
      id: 'cat_3',
      name: 'Jennie',
      questions: ['Did you like "Solo"?', 'Favorite Jennie fashion look?']
    },
    {
      id: 'cat_4',
      name: 'Lisa',
      questions: ['Have you seen the "Money" performance?', 'Favorite Lisa dance break?']
    },
    {
      id: 'cat_5',
      name: 'Rosé',
      questions: ['"On The Ground" or "Gone"?', 'Favorite Rosé acoustic cover?']
    }
  ]
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState(null);
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('Main');
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const [editName, setEditName] = useState('');
  const [editComments, setEditComments] = useState('');

  // --- NEW STATE ---
  const [userName, setUserName] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState('');

  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageStep, setMessageStep] = useState('type'); // 'type' | 'categories' | 'questions'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Prompt Editing State
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [addingQuestionTo, setAddingQuestionTo] = useState(null);

  const fetchData = async () => {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("YOUR_NEW_DEPLOYMENT_ID")) {
      setConnectionStatus('error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      const json = await response.json();

      if (json.status === 'success') {
        setData(json.data);
        setConnectionStatus('connected');
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error(error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedMember) {
      setEditName(selectedMember.name || '');
      setEditComments(selectedMember.comments || '');
    }
  }, [selectedMember]);

  // --- NEW LOGIC ---
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedName = await AsyncStorage.getItem('user_settings_name');
        if (storedName) {
          setUserName(storedName);
        } else {
          setShowOnboarding(true);
        }

        const storedPrompts = await AsyncStorage.getItem('whatsapp_prompts');
        if (storedPrompts) {
          setPrompts(JSON.parse(storedPrompts));
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (data && data.length > 0) {
      scheduleBirthdayNotifications(data);
    }
  }, [data]);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  }

  async function scheduleBirthdayNotifications(members) {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const today = new Date();
    const currentYear = today.getFullYear();
    const birthdays = {};

    members.forEach(m => {
      if (!m.birthday || m.status !== 'In Group') return;
      const date = new Date(m.birthday);
      if (isNaN(date)) return;

      const key = `${date.getMonth()}-${date.getDate()}`; // 0-indexed month
      if (!birthdays[key]) birthdays[key] = [];
      birthdays[key].push(m.name);
    });

    for (const [key, names] of Object.entries(birthdays)) {
      const [month, day] = key.split('-').map(Number);

      // Calculate next occurrence
      let nextBday = new Date(currentYear, month, day);
      if (nextBday < today) {
        nextBday.setFullYear(currentYear + 1);
      }

      // 1. Schedule for 10 PM the previous day
      const prevDay = new Date(nextBday);
      prevDay.setDate(prevDay.getDate() - 1);
      prevDay.setHours(22, 0, 0, 0);

      if (prevDay > today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Upcoming Birthday! 🎂",
            body: `Tomorrow is ${names.join(', ')}'s birthday!`,
          },
          trigger: prevDay,
        });
      }

      // 2. Schedule for 12 AM on the day
      const onDay = new Date(nextBday);
      onDay.setHours(0, 0, 0, 0); // Midnight

      if (onDay > today) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Happy Birthday! 🎉",
            body: `Today is ${names.join(', ')}'s birthday! Wish them well!`,
          },
          trigger: onDay,
        });
      }
    }
  }

  const handleSaveUserName = async () => {
    if (!onboardingName.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }
    try {
      await AsyncStorage.setItem('user_settings_name', onboardingName);
      setUserName(onboardingName);
      setShowOnboarding(false);
    } catch (e) {
      Alert.alert("Error", "Failed to save name.");
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedMember?.phone) {
      Alert.alert("Error", "No phone number available.");
      return;
    }

    const finalMessage = text.replace('{{Name}}', userName || 'Admin');
    const phone = selectedMember.phone.replace(/^0/, '94'); // Assuming SL format, replace leading 0 with 94
    const url = `whatsapp://send?text=${encodeURIComponent(finalMessage)}&phone=${phone}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        setShowMessageModal(false);
      } else {
        Alert.alert("Error", "WhatsApp is not installed.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to open WhatsApp.");
    }
  };

  const savePrompts = async (newPrompts) => {
    setPrompts(newPrompts);
    try {
      await AsyncStorage.setItem('whatsapp_prompts', JSON.stringify(newPrompts));
    } catch (e) {
      console.error("Failed to save prompts", e);
    }
  };

  const handleUpdateInitialMessage = (text) => {
    const newPrompts = { ...prompts, initialMessage: text };
    savePrompts(newPrompts);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName,
      questions: []
    };
    const newPrompts = {
      ...prompts,
      categories: [...prompts.categories, newCategory]
    };
    savePrompts(newPrompts);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catId) => {
    Alert.alert("Delete Category", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const newPrompts = {
            ...prompts,
            categories: prompts.categories.filter(c => c.id !== catId)
          };
          savePrompts(newPrompts);
        }
      }
    ]);
  };

  const handleAddQuestion = (catId) => {
    if (!newQuestionText.trim()) return;
    const newPrompts = {
      ...prompts,
      categories: prompts.categories.map(c => {
        if (c.id === catId) {
          return { ...c, questions: [...c.questions, newQuestionText] };
        }
        return c;
      })
    };
    savePrompts(newPrompts);
    setNewQuestionText('');
    setAddingQuestionTo(null);
  };

  const handleDeleteQuestion = (catId, questionIndex) => {
    const newPrompts = {
      ...prompts,
      categories: prompts.categories.map(c => {
        if (c.id === catId) {
          const newQuestions = [...c.questions];
          newQuestions.splice(questionIndex, 1);
          return { ...c, questions: newQuestions };
        }
        return c;
      })
    };
    savePrompts(newPrompts);
  };

  const handleUpdateStatus = async (memberId, newStatus) => {
    const updatedData = data.map(m => m.id === memberId ? { ...m, status: newStatus } : m);
    setData(updatedData);
    setSelectedMember(prev => ({ ...prev, status: newStatus }));

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ id: memberId, status: newStatus }),
        headers: { "Content-Type": "text/plain" }
      });
    } catch (error) {
      console.error("Update failed", error);
      Alert.alert("Error", "Failed to save to Google Sheet.");
    }
  };

  const handleUpdateMemberDetails = async () => {
    if (!selectedMember) return;

    const updatedMember = { ...selectedMember, name: editName, comments: editComments };
    const updatedData = data.map(m => m.id === selectedMember.id ? updatedMember : m);
    setData(updatedData);
    setSelectedMember(updatedMember);

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: 'updateMemberDetails',
          id: selectedMember.id,
          name: editName,
          comments: editComments
        }),
        headers: { "Content-Type": "text/plain" }
      });
      Alert.alert("Success", "Details saved!");
    } catch (error) {
      console.error("Update details failed", error);
      Alert.alert("Error", "Failed to save details.");
    }
  };

  const handleSaveContact = async (member) => {
    if (!member.phone) {
      Alert.alert("Error", "No phone number to save.");
      return;
    }

    try {
      const updatedData = data.map(m => m.id === member.id ? { ...m, isSaved: true } : m);
      setData(updatedData);
      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember(prev => ({ ...prev, isSaved: true }));
      }

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: 'saveContact', name: member.name, phone: member.phone }),
        headers: { "Content-Type": "text/plain" }
      });

      Alert.alert("Success", "Contact save request sent!");
    } catch (error) {
      console.error("Save contact failed", error);
      Alert.alert("Error", "Failed to save contact.");
    }
  };

  const filteredMembers = useMemo(() => {
    return data.filter(member => {
      const name = member.name || '';
      const phone = member.phone || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phone && phone.toString().includes(searchTerm));

      if (!matchesSearch) return false;

      if (filter === 'Main') return member.status === 'In Group';
      if (filter === 'Contacted') return member.status === 'No Response';
      if (filter === 'Pending') return member.status === 'Not Contacted';
      if (filter === 'Removed') return member.status === 'Removed';

      return true;
    });
  }, [data, searchTerm, filter]);

  const waitingCount = data.filter(m => m.status === 'No Response' || m.status === 'Not Contacted').length;

  const recentlyAdded = [...data]
    .sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0))
    .slice(0, 3);

  const upcomingBirthdaysPreview = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    return data
      .filter(m => {
        const d = new Date(m.birthday);
        return !isNaN(d) && d.getMonth() >= currentMonth && m.status === 'In Group';
      })
      .sort((a, b) => new Date(a.birthday).getMonth() - new Date(b.birthday).getMonth())
      .slice(0, 3);
  }, [data]);

  const fullBirthdayTimeline = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data
      .filter(m => m.birthday && !isNaN(new Date(m.birthday).getTime()) && m.status === 'In Group')
      .map(m => {
        const bday = new Date(m.birthday);
        const currentYear = today.getFullYear();
        let nextBday = new Date(currentYear, bday.getMonth(), bday.getDate());

        if (nextBday < today) {
          nextBday.setFullYear(currentYear + 1);
        }

        const diffTime = nextBday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...m,
          nextBday,
          diffDays,
          ageTurning: nextBday.getFullYear() - bday.getFullYear()
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [data]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Group': return '#22c55e';
      case 'Removed': return '#ef4444';
      case 'No Response': return '#facc15';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <View style={[styles.padding, (activeTab === 'members' || activeTab === 'birthdays' || activeTab === 'edit') && { flex: 1 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {activeTab === 'dashboard' ? 'DASHBOARD' :
                activeTab === 'birthdays' ? 'CELEBRATION TIMELINE' :
                  activeTab === 'edit' ? 'SETTINGS' : 'MEMBERS'}
            </Text>
            {loading && <Loader size={20} color="#06b6d4" />}
          </View>

          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <ScrollView>
              <TouchableOpacity
                onPress={() => { setFilter('Pending'); setActiveTab('members'); }}
                style={styles.card}
              >
                <View style={styles.cardIcon}>
                  <Edit3 size={20} color="#6b7280" />
                </View>
                <View style={styles.kpiRow}>
                  <Text style={styles.kpiNumber}>{waitingCount}</Text>
                  <Text style={styles.kpiLabel}>WAITING</Text>
                </View>
                <View style={styles.cardAction}>
                  <Text style={styles.actionText}>View</Text>
                  <ArrowRight size={14} color="#22d3ee" />
                </View>
              </TouchableOpacity>

              <View style={[styles.card, styles.mt16]}>
                <View style={styles.cardIcon}>
                  <Users size={20} color="#6b7280" />
                </View>
                <Text style={styles.cardTitle}>RECENTLY ADDED</Text>
                <View style={styles.mt16}>
                  {recentlyAdded.map((user, i) => (
                    <View key={user.id || i} style={styles.listItem}>
                      <View>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userPhone}>{user.phone}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedMember(user)}>
                        <Text style={styles.viewButton}>View</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.card, styles.mt16]}>
                <View style={styles.cardIcon}>
                  <Cake size={24} color="#f472b6" />
                </View>
                <Text style={styles.cardTitle}>UPCOMING BIRTHDAYS</Text>
                <View style={styles.mt16}>
                  {upcomingBirthdaysPreview.map((user, i) => {
                    const date = new Date(user.birthday);
                    const month = date.toLocaleString('default', { month: 'short' });
                    const day = date.getDate();
                    return (
                      <TouchableOpacity key={user.id || i} style={styles.birthdayItem} onPress={() => setSelectedMember(user)}>
                        <Text style={styles.birthdayDate}>{month} {day}</Text>
                        <Text style={styles.birthdayName}>{user.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity onPress={() => setActiveTab('birthdays')} style={styles.cardActionBottom}>
                  <Text style={styles.actionText}>View Full Timeline</Text>
                  <ArrowRight size={14} color="#22d3ee" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* Members View */}
          {activeTab === 'members' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchContainer}>
                <View style={styles.searchIcon}>
                  <Search size={18} color="#6b7280" />
                </View>
                <TextInput
                  placeholder="Search..."
                  placeholderTextColor="#4b5563"
                  style={styles.searchInput}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                {[
                  { id: 'Main', label: 'In Group' },
                  { id: 'Contacted', label: 'No Response' },
                  { id: 'Pending', label: 'Not Contacted' },
                  { id: 'Removed', label: 'Removed' }
                ].map(tab => {
                  const count = data.filter(m => {
                    if (tab.id === 'Main') return m.status === 'In Group';
                    if (tab.id === 'Contacted') return m.status === 'No Response';
                    if (tab.id === 'Pending') return m.status === 'Not Contacted';
                    if (tab.id === 'Removed') return m.status === 'Removed';
                    return false;
                  }).length;

                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setFilter(tab.id)}
                      style={[styles.tab, filter === tab.id && styles.tabActive]}
                    >
                      <Text style={filter === tab.id ? styles.tabTextActive : styles.tabText}>{tab.id}</Text>
                      <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                data={filteredMembers}
                keyExtractor={(item, index) => (item.id || index).toString()}
                renderItem={({ item: member }) => (
                  <View style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <User size={18} color="#9ca3af" />
                      <View style={styles.memberDetails}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName}>{member.name || 'Unknown'}</Text>
                          {member.score && (
                            <View style={[styles.scoreBadge, member.score <= 3 && styles.scoreBadgeLow]}>
                              <Text style={[styles.scoreText, member.score <= 3 && styles.scoreTextLow]}>{member.score}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.memberPhoneRow}>
                          <Phone size={12} color="#6b7280" />
                          <Text style={styles.memberPhone}>{member.phone || '--'}</Text>
                          {member.bias && (
                            <Text style={styles.memberBias}>• {member.bias}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.memberActions}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
                      <TouchableOpacity
                        onPress={() => setSelectedMember(member)}
                        style={styles.viewMemberButton}
                      >
                        <Text style={styles.viewMemberButtonText}>VIEW</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          {/* Edit / Prompts View */}
          {activeTab === 'edit' && (
            <ScrollView style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>MESSAGE TEMPLATES</Text>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>INITIAL MESSAGE</Text>
                <Text style={styles.helperText}>Use {"{{Name}}"} to insert your name automatically.</Text>
                <TextInput
                  style={styles.commentsInput}
                  multiline
                  value={prompts.initialMessage}
                  onChangeText={handleUpdateInitialMessage}
                  placeholder="Enter initial message..."
                  placeholderTextColor="#6b7280"
                />
              </View>

              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>CATEGORIES & QUESTIONS</Text>
                <TouchableOpacity onPress={() => setAddingQuestionTo('new_category')}>
                  <Plus size={20} color="#22d3ee" />
                </TouchableOpacity>
              </View>

              {addingQuestionTo === 'new_category' && (
                <View style={styles.addInputContainer}>
                  <TextInput
                    style={styles.addInput}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="New Category Name"
                    placeholderTextColor="#6b7280"
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleAddCategory} style={styles.addButton}>
                    <Check size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAddingQuestionTo(null)} style={styles.cancelButton}>
                    <XCircle size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              {prompts.categories.map(category => (
                <View key={category.id} style={styles.categoryCard}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {expandedCategory === category.id ? <ChevronUp size={16} color="#22d3ee" /> : <ChevronDown size={16} color="#6b7280" />}
                      <Text style={[styles.categoryTitle, expandedCategory === category.id && styles.categoryTitleActive]}>
                        {category.name}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.questionCount}>{category.questions.length}</Text>
                      <TouchableOpacity onPress={() => handleDeleteCategory(category.id)} style={{ marginLeft: 12 }}>
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {expandedCategory === category.id && (
                    <View style={styles.questionsList}>
                      {category.questions.map((q, idx) => (
                        <View key={idx} style={styles.questionItem}>
                          <Text style={styles.questionText}>{q}</Text>
                          <TouchableOpacity onPress={() => handleDeleteQuestion(category.id, idx)}>
                            <Trash2 size={12} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {addingQuestionTo === category.id ? (
                        <View style={styles.addInputContainer}>
                          <TextInput
                            style={styles.addInput}
                            value={newQuestionText}
                            onChangeText={setNewQuestionText}
                            placeholder="New Question"
                            placeholderTextColor="#6b7280"
                            autoFocus
                          />
                          <TouchableOpacity onPress={() => handleAddQuestion(category.id)} style={styles.addButton}>
                            <Check size={16} color="#ffffff" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setAddingQuestionTo(null)} style={styles.cancelButton}>
                            <XCircle size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addQuestionButton}
                          onPress={() => setAddingQuestionTo(category.id)}
                        >
                          <Plus size={14} color="#22d3ee" />
                          <Text style={styles.addQuestionText}>Add Question</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Birthdays Timeline View */}
          {activeTab === 'birthdays' && (
            <ScrollView>
              {fullBirthdayTimeline.length === 0 ? (
                <Text style={styles.emptyText}>No birthday data available.</Text>
              ) : (
                <View style={{ paddingBottom: 80 }}>
                  {fullBirthdayTimeline.map((member, index) => {
                    const isNext = index === 0;
                    const date = member.nextBday;
                    const month = date.toLocaleString('default', { month: 'short' });
                    const day = date.getDate();
                    const dayOfWeek = date.toLocaleString('default', { weekday: 'long' });

                    return (
                      <View key={member.id} style={styles.timelineItem}>
                        <View style={[styles.timelineNode, isNext && styles.timelineNodeActive]}>
                          <Text style={[styles.timelineMonth, isNext && styles.timelineMonthActive]}>{month.toUpperCase()}</Text>
                          <Text style={[styles.timelineDay, isNext && styles.timelineDayActive]}>{day}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => setSelectedMember(member)}
                          style={[styles.timelineCard, isNext && styles.timelineCardActive]}
                        >
                          {isNext && (
                            <View style={styles.timelineUpNext}>
                              <View style={styles.upNextBadge}>
                                <Text style={styles.upNextText}>UP NEXT</Text>
                              </View>
                              <Text style={styles.upNextDays}>
                                {member.diffDays === 0 ? "TODAY!" : `In ${member.diffDays} days`}
                              </Text>
                            </View>
                          )}

                          <Text style={[styles.timelineName, isNext && styles.timelineNameActive]}>{member.name}</Text>
                          <View style={styles.timelineInfo}>
                            <Gift size={14} color="#6b7280" />
                            <Text style={styles.timelineInfoText}>Turning {member.ageTurning} on {dayOfWeek}</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  <View style={styles.timelineEnd}>
                    <Sparkles size={16} color="#a855f7" />
                    <Text style={styles.timelineEndText}>End of upcoming celebrations</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavIcon icon={<User size={20} color={activeTab === 'profile' ? '#ec4899' : '#6b7280'} />} active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
        <NavIcon icon={<LayoutDashboard size={20} color={activeTab === 'dashboard' ? '#ec4899' : '#6b7280'} />} active={activeTab === 'dashboard'} onPress={() => setActiveTab('dashboard')} />
        <NavIcon icon={<Users size={20} color={activeTab === 'members' ? '#ec4899' : '#6b7280'} />} active={activeTab === 'members'} onPress={() => setActiveTab('members')} />
        <NavIcon icon={<Edit3 size={20} color={activeTab === 'edit' ? '#ec4899' : '#6b7280'} />} active={activeTab === 'edit'} onPress={() => setActiveTab('edit')} />
        <NavIcon icon={<Cake size={20} color={activeTab === 'birthdays' ? '#ec4899' : '#6b7280'} />} active={activeTab === 'birthdays'} onPress={() => setActiveTab('birthdays')} />
        <NavIcon icon={<Settings size={20} color={activeTab === 'settings' ? '#ec4899' : '#6b7280'} />} active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
      </View>

      {/* Member Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedMember}
        onRequestClose={() => setSelectedMember(null)}
      >
        <GestureHandlerRootView style={styles.modalOverlay}>
          <DraggableModalContent onClose={() => setSelectedMember(null)}>
            {selectedMember && (
              <View style={{ flex: 1 }}>
                <View style={styles.modalHeader}>
                  <View style={styles.dragHandle} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.modalNameRow}>
                        <TextInput
                          value={editName}
                          onChangeText={setEditName}
                          style={styles.modalNameInput}
                          placeholder="Name"
                          placeholderTextColor="#6b7280"
                        />
                        <TouchableOpacity onPress={handleUpdateMemberDetails}>
                          <Save size={20} color="#06b6d4" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.modalPhone}>{selectedMember.phone}</Text>

                      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                        {selectedMember.isSaved ? (
                          <View style={styles.contactSaved}>
                            <Check size={12} color="#22c55e" />
                            <Text style={styles.contactSavedText}>SAVED</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleSaveContact(selectedMember)}
                            style={styles.saveContactButton}
                          >
                            <UserPlus size={12} color="#f472b6" />
                            <Text style={styles.saveContactText}>SAVE</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => {
                            setShowMessageModal(true);
                            setMessageStep('type');
                          }}
                          style={styles.messageButton}
                        >
                          <MessageSquare size={12} color="#22d3ee" />
                          <Text style={styles.messageButtonText}>MESSAGE</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedMember(null)} style={{ padding: 8 }}>
                      <XCircle size={24} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView style={{ flex: 1, padding: 24 }}>
                  <View style={{ marginBottom: 24 }}>
                    <Text style={styles.sectionLabel}>UPDATE STATUS</Text>
                    <StatusSelector
                      currentStatus={selectedMember.status}
                      onUpdate={(newStatus) => handleUpdateStatus(selectedMember.id, newStatus)}
                    />
                  </View>

                  <View style={styles.detailsGrid}>
                    <DetailItem icon={<Calendar size={16} color="#4b5563" />} label="Birthday" value={selectedMember.birthday ? new Date(selectedMember.birthday).toLocaleDateString() : '--'} />
                    <DetailItem icon={<Clock size={16} color="#4b5563" />} label="Added On" value={selectedMember.dateAdded ? new Date(selectedMember.dateAdded).toLocaleDateString() : '--'} />
                    <DetailItem icon={<Star size={16} color="#4b5563" />} label="Score" value={selectedMember.score || '--'} />
                    <DetailItem icon={<User size={16} color="#4b5563" />} label="Bias" value={selectedMember.bias || '--'} />
                  </View>

                  <View style={{ marginTop: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <MessageSquare size={14} color="#6b7280" />
                      <Text style={[styles.sectionLabel, { marginLeft: 8, marginBottom: 0 }]}>COMMENTS</Text>
                    </View>
                    <TextInput
                      value={editComments}
                      onChangeText={setEditComments}
                      multiline
                      style={styles.commentsInput}
                      placeholder="Add comments..."
                      placeholderTextColor="#6b7280"
                    />
                    <TouchableOpacity onPress={handleUpdateMemberDetails} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                      <Text style={styles.saveChangesText}>SAVE CHANGES</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.generateSection}>
                    <TouchableOpacity
                      onPress={() => setShowGenerator(true)}
                      style={styles.generateButton}
                    >
                      <Wand2 size={16} color="#9ca3af" />
                      <Text style={styles.generateButtonText}>GENERATE BIRTHDAY WISH</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            )}
          </DraggableModalContent>
        </GestureHandlerRootView>
      </Modal>

      {showGenerator && selectedMember && (
        <BirthdayCardGenerator
          member={selectedMember}
          onClose={() => setShowGenerator(false)}
        />
      )}

      {/* Onboarding Modal */}
      <Modal
        visible={showOnboarding}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.onboardingOverlay}>
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>Welcome, Admin!</Text>
            <Text style={styles.onboardingText}>Please enter your name to personalize messages.</Text>
            <TextInput
              style={styles.onboardingInput}
              value={onboardingName}
              onChangeText={setOnboardingName}
              placeholder="Your Name"
              placeholderTextColor="#6b7280"
            />
            <TouchableOpacity onPress={handleSaveUserName} style={styles.onboardingButton}>
              <Text style={styles.onboardingButtonText}>GET STARTED</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Message Selection Modal */}
      <Modal
        visible={showMessageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.headerText}>SEND MESSAGE</Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <XCircle size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 24 }}>
              {messageStep === 'type' && (
                <View>
                  <TouchableOpacity
                    style={styles.messageOption}
                    onPress={() => handleSendMessage(prompts.initialMessage)}
                  >
                    <View style={styles.messageOptionIcon}>
                      <Sparkles size={20} color="#f472b6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.messageOptionTitle}>Initial Message</Text>
                      <Text style={styles.messageOptionPreview} numberOfLines={1}>
                        {prompts.initialMessage.replace('{{Name}}', userName || 'Admin')}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#6b7280" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.messageOption}
                    onPress={() => setMessageStep('categories')}
                  >
                    <View style={styles.messageOptionIcon}>
                      <MessageSquare size={20} color="#22d3ee" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.messageOptionTitle}>Ask a Question</Text>
                      <Text style={styles.messageOptionPreview}>Select from categories...</Text>
                    </View>
                    <ChevronRight size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              )}

              {messageStep === 'categories' && (
                <View>
                  <TouchableOpacity onPress={() => setMessageStep('type')} style={styles.backButton}>
                    <ArrowRight size={14} color="#6b7280" style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>

                  {prompts.categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.categoryOption}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setMessageStep('questions');
                      }}
                    >
                      <Text style={styles.categoryOptionText}>{cat.name}</Text>
                      <ChevronRight size={16} color="#6b7280" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {messageStep === 'questions' && selectedCategory && (
                <View>
                  <TouchableOpacity onPress={() => setMessageStep('categories')} style={styles.backButton}>
                    <ArrowRight size={14} color="#6b7280" style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text style={styles.backButtonText}>Back to Categories</Text>
                  </TouchableOpacity>

                  <Text style={styles.selectedCategoryTitle}>{selectedCategory.name}</Text>

                  {selectedCategory.questions.map((q, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.questionOption}
                      onPress={() => handleSendMessage(q)}
                    >
                      <Text style={styles.questionOptionText}>{q}</Text>
                      <Send size={14} color="#22d3ee" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const NavIcon = ({ icon, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.navIcon, active && styles.navIconActive]}
  >
    {icon}
  </TouchableOpacity>
);

const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <View style={{ marginTop: 4 }}>{icon}</View>
    <View style={{ marginLeft: 12 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const StatusSelector = ({ currentStatus, onUpdate }) => {
  const statuses = [
    { id: 'Not Contacted', label: 'Not Contacted', color: '#ffffff' },
    { id: 'No Response', label: 'No Response', color: '#facc15' },
    { id: 'In Group', label: 'In Group', color: '#22c55e' },
    { id: 'Removed', label: 'Removed', color: '#ef4444' },
  ];

  return (
    <View>
      {statuses.map(s => (
        <TouchableOpacity
          key={s.id}
          onPress={() => onUpdate(s.id)}
          style={[styles.statusOption, currentStatus === s.id && styles.statusOptionActive]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusDot, { backgroundColor: s.color }]} />
            <Text style={[styles.statusLabel, currentStatus === s.id && styles.statusLabelActive]}>{s.label}</Text>
          </View>
          {currentStatus === s.id && <CheckCircle size={16} color="#06b6d4" />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const DraggableModalContent = ({ children, onClose }) => {
  const translateY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateY.value = Math.max(0, ctx.startY + event.translationY);
    },
    onEnd: (event) => {
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.modalContent, animatedStyle]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingBottom: 64,
  },
  padding: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 20,
    letterSpacing: 3,
    color: '#fce7f3',
    fontWeight: '300',
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 24,
    borderRadius: 4,
    position: 'relative',
  },
  cardIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  kpiNumber: {
    fontSize: 60,
    fontWeight: '300',
    color: '#ffffff',
    marginRight: 12,
  },
  kpiLabel: {
    fontSize: 18,
    letterSpacing: 2,
    color: '#9ca3af',
  },
  cardAction: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  cardTitle: {
    fontSize: 12,
    letterSpacing: 2,
    color: '#fce7f3',
    opacity: 0.7,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 41, 55, 0.5)',
    paddingBottom: 8,
    marginBottom: 16,
  },
  userName: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  userPhone: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  viewButton: {
    color: '#22d3ee',
    fontSize: 12,
  },
  birthdayItem: {
    marginBottom: 24,
  },
  birthdayDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginRight: 12,
  },
  birthdayName: {
    color: '#d1d5db',
    fontWeight: '300',
  },
  cardActionBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 10,
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'rgba(17, 24, 39, 0.3)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 999,
    paddingVertical: 12,
    paddingLeft: 48,
    paddingRight: 16,
    color: '#d1d5db',
    fontWeight: '300',
  },
  tabsContainer: {
    marginBottom: 16,
    flexGrow: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    borderColor: '#1f2937',
  },
  tabActive: {
    backgroundColor: '#111827',
    borderColor: '#ec4899',
  },
  tabText: {
    fontWeight: '500',
    color: '#9ca3af',
    marginRight: 8,
  },
  tabTextActive: {
    fontWeight: '500',
    color: '#ffffff',
    marginRight: 8,
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'rgba(17, 24, 39, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#1f2937',
  },
  scoreBadgeLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  scoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  scoreTextLow: {
    color: '#f87171',
  },
  memberPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberPhone: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'monospace',
    marginLeft: 4,
  },
  memberBias: {
    marginLeft: 8,
    color: 'rgba(236, 72, 153, 0.7)',
    fontSize: 12,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  viewMemberButton: {
    backgroundColor: 'rgba(22, 78, 99, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewMemberButtonText: {
    color: '#22d3ee',
    fontSize: 10,
    fontWeight: '500',
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 80,
    marginBottom: 32,
  },
  timelineNode: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  timelineNodeActive: {
    borderColor: '#22d3ee',
  },
  timelineMonth: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  timelineMonthActive: {
    color: '#22d3ee',
  },
  timelineDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d1d5db',
  },
  timelineDayActive: {
    color: '#ffffff',
  },
  timelineCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
  },
  timelineCardActive: {
    backgroundColor: '#111827',
    borderColor: 'rgba(6, 182, 212, 0.5)',
  },
  timelineUpNext: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  upNextBadge: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 8,
  },
  upNextText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  upNextDays: {
    color: '#22d3ee',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  timelineName: {
    fontSize: 18,
    fontWeight: '300',
    color: '#e5e7eb',
  },
  timelineNameActive: {
    color: '#ffffff',
  },
  timelineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timelineInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  timelineEnd: {
    alignItems: 'center',
    marginTop: 48,
  },
  timelineEndText: {
    color: '#4b5563',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 80,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(17, 24, 39, 0.5)',
    backgroundColor: '#000000',
  },
  navIcon: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    height: '85%',
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#4b5563',
    borderRadius: 2,
    marginBottom: 8,
  },
  modalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalNameInput: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    flex: 1,
    marginRight: 8,
  },
  modalPhone: {
    color: '#06b6d4',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  contactSaved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  contactSavedText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  saveContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  saveContactText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 2,
    marginBottom: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: '#1f2937',
    marginBottom: 8,
  },
  statusOptionActive: {
    backgroundColor: '#1f2937',
    borderColor: '#06b6d4',
  },
  statusLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 12,
  },
  statusLabelActive: {
    color: '#ffffff',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  detailValue: {
    color: '#d1d5db',
    fontSize: 14,
  },
  commentsInput: {
    width: '100%',
    backgroundColor: 'rgba(31, 41, 55, 0.2)',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    color: '#d1d5db',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveChangesText: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '500',
    letterSpacing: 1,
  },
  generateSection: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingBottom: 40,
    marginTop: 24,
  },
  generateButton: {
    width: '100%',
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#9ca3af',
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 1,
    marginLeft: 8,
  },
  mt16: {
    marginTop: 16,
  },
  // --- NEW STYLES ---
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 2,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 8,
    padding: 4,
  },
  addInput: {
    flex: 1,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#22c55e',
    borderRadius: 6,
    marginRight: 4,
  },
  cancelButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
  },
  categoryCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
  },
  categoryTitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 12,
    fontWeight: '500',
  },
  categoryTitleActive: {
    color: '#22d3ee',
  },
  questionCount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  questionsList: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  questionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 41, 55, 0.5)',
  },
  questionText: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
  },
  addQuestionText: {
    color: '#22d3ee',
    fontSize: 12,
    marginLeft: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  messageButtonText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 24,
  },
  onboardingCard: {
    backgroundColor: '#111827',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 2,
  },
  onboardingText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  onboardingInput: {
    width: '100%',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  onboardingButton: {
    width: '100%',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  onboardingButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  messageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  messageOptionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  messageOptionPreview: {
    color: '#6b7280',
    fontSize: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#6b7280',
    marginLeft: 8,
    fontSize: 14,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 41, 55, 0.5)',
  },
  categoryOptionText: {
    color: '#d1d5db',
    fontSize: 16,
  },
  selectedCategoryTitle: {
    fontSize: 20,
    color: '#fce7f3',
    fontWeight: '300',
    marginBottom: 24,
    letterSpacing: 1,
  },
  questionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  questionOptionText: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
});

export default App;
