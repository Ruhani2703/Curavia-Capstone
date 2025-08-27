import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Fade from '@mui/material/Fade';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  category: 'healing' | 'strength' | 'hope' | 'perseverance' | 'gratitude';
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedDate: string;
}

interface MotivationWidgetProps {
  patientName?: string;
  recoveryProgress?: number;
  daysPostSurgery?: number;
}

export function MotivationWidget({ 
  patientName = 'Patient',
  recoveryProgress = 75,
  daysPostSurgery = 22
}: MotivationWidgetProps) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showQuote, setShowQuote] = useState(true);

  const motivationalQuotes: MotivationalQuote[] = [
    {
      id: '1',
      text: "Every step forward is a step toward recovery.",
      author: "Recovery Wisdom",
      category: 'healing',
      icon: 'solar:walking-bold'
    },
    {
      id: '2',
      text: "Your body has the incredible ability to heal itself. Trust the process.",
      author: "Medical Insight",
      category: 'healing',
      icon: 'solar:heart-pulse-bold'
    },
    {
      id: '3',
      text: "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
      author: "Rikki Rogers",
      category: 'strength',
      icon: 'solar:dumbbell-bold'
    },
    {
      id: '4',
      text: "Recovery is not a race. It's a journey of patience, determination, and self-compassion.",
      author: "Healing Hearts",
      category: 'perseverance',
      icon: 'solar:route-bold'
    },
    {
      id: '5',
      text: "Hope is the thing with feathers that perches in the soul and sings the tune without the words.",
      author: "Emily Dickinson",
      category: 'hope',
      icon: 'solar:star-bold'
    },
    {
      id: '6',
      text: "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.",
      author: "Melody Beattie",
      category: 'gratitude',
      icon: 'solar:heart-bold'
    },
    {
      id: '7',
      text: "The human spirit is stronger than anything that can happen to it.",
      author: "C.C. Scott",
      category: 'strength',
      icon: 'solar:shield-bold'
    },
    {
      id: '8',
      text: "Take time to celebrate your progress, no matter how small.",
      author: "Recovery Wisdom",
      category: 'gratitude',
      icon: 'solar:crown-bold'
    }
  ];

  const recentAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Week Strong',
      description: 'Completed your first week of recovery',
      icon: 'solar:calendar-bold',
      color: 'success',
      unlockedDate: '7 days ago'
    },
    {
      id: '2',
      title: 'Medicine Master',
      description: '100% medication adherence for 5 days',
      icon: 'solar:medical-kit-bold',
      color: 'primary',
      unlockedDate: '3 days ago'
    },
    {
      id: '3',
      title: 'Walking Warrior',
      description: 'Walked 5000 steps in a single day',
      icon: 'solar:walking-bold',
      color: 'warning',
      unlockedDate: '2 days ago'
    },
    {
      id: '4',
      title: 'Progress Champion',
      description: 'Reached 75% recovery milestone',
      icon: 'solar:crown-bold',
      color: 'success',
      unlockedDate: '1 day ago'
    }
  ];

  const currentQuote = motivationalQuotes[currentQuoteIndex];

  // Auto-rotate quotes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowQuote(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => 
          prev === motivationalQuotes.length - 1 ? 0 : prev + 1
        );
        setShowQuote(true);
      }, 300);
    }, 30000);

    return () => clearInterval(interval);
  }, [motivationalQuotes.length]);

  const handleNextQuote = () => {
    setShowQuote(false);
    setTimeout(() => {
      setCurrentQuoteIndex((prev) => 
        prev === motivationalQuotes.length - 1 ? 0 : prev + 1
      );
      setShowQuote(true);
    }, 300);
  };

  const handlePrevQuote = () => {
    setShowQuote(false);
    setTimeout(() => {
      setCurrentQuoteIndex((prev) => 
        prev === 0 ? motivationalQuotes.length - 1 : prev - 1
      );
      setShowQuote(true);
    }, 300);
  };

  const getCategoryColor = (category: MotivationalQuote['category']) => {
    switch (category) {
      case 'healing':
        return 'success';
      case 'strength':
        return 'error';
      case 'hope':
        return 'primary';
      case 'perseverance':
        return 'warning';
      case 'gratitude':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const getPersonalizedMessage = () => {
    if (recoveryProgress >= 90) {
      return `Amazing work, ${patientName}! You're almost fully recovered! 🎉`;
    }
    if (recoveryProgress >= 75) {
      return `Great progress, ${patientName}! You're doing fantastic! 🌟`;
    }
    if (recoveryProgress >= 50) {
      return `Keep going, ${patientName}! You're more than halfway there! 💪`;
    }
    if (recoveryProgress >= 25) {
      return `Steady progress, ${patientName}! Every day counts! 🌱`;
    }
    return `You've got this, ${patientName}! One day at a time! 🌈`;
  };

  return (
    <Card sx={{ bgcolor: 'primary.lighter', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          opacity: 0.1
        }}
      />
      
      <CardContent>
        <Box sx={{ textAlign: 'center', position: 'relative' }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" color="primary.main">
              Daily Motivation
            </Typography>
            <Chip 
              label={`Day ${daysPostSurgery}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>

          {/* Personalized Message */}
          <Typography
            variant="body1"
            sx={{ 
              mb: 3, 
              color: 'primary.dark',
              fontWeight: 'medium',
              fontSize: '1.1rem'
            }}
          >
            {getPersonalizedMessage()}
          </Typography>

          {/* Quote Section */}
          <Fade in={showQuote} timeout={300}>
            <Box sx={{ mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: `${getCategoryColor(currentQuote.category)}.main`,
                  width: 60,
                  height: 60,
                  mx: 'auto',
                  mb: 2
                }}
              >
                <Iconify icon={currentQuote.icon} width={30} />
              </Avatar>
              
              <Typography
                variant="h6"
                sx={{ 
                  mb: 2, 
                  fontStyle: 'italic',
                  color: 'text.primary',
                  lineHeight: 1.4,
                  minHeight: '3em' // Prevent layout shift
                }}
              >
                "{currentQuote.text}"
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                — {currentQuote.author}
              </Typography>
              
              <Chip 
                label={currentQuote.category}
                size="small"
                color={getCategoryColor(currentQuote.category) as any}
                sx={{ mt: 1 }}
              />
            </Box>
          </Fade>

          {/* Quote Navigation */}
          <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: 3 }}>
            <IconButton 
              size="small" 
              onClick={handlePrevQuote}
              sx={{ bgcolor: 'background.paper' }}
            >
              <Iconify icon="solar:arrow-left-bold" />
            </IconButton>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                px: 2
              }}
            >
              {currentQuoteIndex + 1} of {motivationalQuotes.length}
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleNextQuote}
              sx={{ bgcolor: 'background.paper' }}
            >
              <Iconify icon="solar:arrow-right-bold" />
            </IconButton>
          </Stack>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.dark' }}>
                🏆 Recent Achievements
              </Typography>
              <Stack spacing={1}>
                {recentAchievements.slice(0, 2).map((achievement) => (
                  <Box
                    key={achievement.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      boxShadow: 1
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: `${achievement.color}.main`,
                        width: 32,
                        height: 32,
                        mr: 1.5
                      }}
                    >
                      <Iconify icon={achievement.icon} width={16} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {achievement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {achievement.unlockedDate}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="solar:share-bold" />}
            >
              Share Progress
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:bookmark-bold" />}
            >
              Save Quote
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}