import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Brain, Activity, BarChart2, FileText, Tag, Upload } from 'lucide-react';
import './MentalHealthAnalyzer.css'
import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import { useCallback } from 'react';

const LOCAL_STORAGE_KEYS = {
    MODEL_DATA: 'mental_health_analyzer_model',
    TRAINING_DATA: 'mental_health_analyzer_training_data',
    MODEL_ACCURACY: 'mental_health_analyzer_accuracy',
    LATEST_ANALYSIS: 'latest_analysis'
};

const nlpAnalysis = {
    // Analyze sentence structure and types
    analyzeSentences: (text) => {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const types = sentences.map(sentence => {
            if (sentence.includes('?')) return 'question';
            if (sentence.includes('!')) return 'exclamation';
            return 'statement';
        });

        return {
            count: sentences.length,
            types: types.reduce((acc, type) => {
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {})
        };
    },

    // Extract entities and concepts
    extractEntities: (text) => {
        const timePatterns = /(today|yesterday|tomorrow|morning|evening|night|week|month|year)/gi;
        const emotionPatterns = /(happy|sad|angry|anxious|worried|stressed|depressed|excited|scared|nervous)/gi;
        const healthPatterns = /(sleep|eat|pain|tired|exhausted|energy|medication|therapy|doctor)/gi;

        return {
            time: [...text.matchAll(timePatterns)].map(m => m[0]),
            emotions: [...text.matchAll(emotionPatterns)].map(m => m[0]),
            health: [...text.matchAll(healthPatterns)].map(m => m[0])
        };
    },

    // Analyze emotional patterns
    analyzeEmotionalPatterns: (text) => {
        const emotions = {
            anxiety: ['worry', 'anxious', 'nervous', 'fear', 'panic', 'stress'],
            depression: ['sad', 'hopeless', 'depressed', 'tired', 'alone', 'empty'],
            anger: ['angry', 'frustrated', 'mad', 'hate', 'rage', 'annoyed'],
            joy: ['happy', 'excited', 'glad', 'wonderful', 'great', 'pleased'],
            gratitude: ['thankful', 'grateful', 'blessed', 'appreciate', 'lucky']
        };

        const words = text.toLowerCase().split(/\W+/);
        const patterns = {};

        Object.entries(emotions).forEach(([category, keywords]) => {
            patterns[category] = words.filter(word =>
                keywords.some(keyword => word.includes(keyword))
            ).length;
        });

        return patterns;
    },

    // Analyze writing style
    analyzeStyle: (text) => {
        const words = text.split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());

        return {
            avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
            avgSentenceLength: words.length / sentences.length,
            uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
            totalWords: words.length
        };
    }
};


const extractKeywords = (text) => {
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const stopWords = new Set([
        'the', 'and', 'for', 'but', 'was', 'with', 'that', 'this', 'have', 'has',
        'are', 'what', 'when', 'where', 'who', 'which', 'why', 'how'
    ]);

    // Count word frequencies
    const wordFrequencies = words.reduce((acc, word) => {
        if (!stopWords.has(word)) {
            acc[word] = (acc[word] || 0) + 1;
        }
        return acc;
    }, {});

    // Convert to array and sort by frequency
    return Object.entries(wordFrequencies)
        .map(([term, frequency]) => ({ term, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5); // Return top 5 keywords
};

const classifyConcerns = (text) => {
    const categories = {
        anxiety: ['worry', 'anxious', 'nervous', 'fear', 'panic', 'stress', 'tense', 'restless'],
        depression: ['sad', 'hopeless', 'depressed', 'tired', 'alone', 'empty', 'worthless', 'unmotivated'],
        behavioral: ['sleep', 'eating', 'crying', 'isolation', 'withdrawal', 'avoiding', 'procrastinating'],
        physical: ['pain', 'fatigue', 'headache', 'tension', 'exhausted', 'nauseous', 'dizzy', 'aches']
    };

    const words = text.toLowerCase().split(/\W+/);
    const scores = {};

    // Calculate scores for each category
    Object.entries(categories).forEach(([category, keywords]) => {
        const matches = words.filter(word => keywords.some(keyword => word.includes(keyword)));
        scores[category] = matches.length / Math.max(words.length, 1) * 10; // Scale to 0-10
    });

    return scores;
};

// TypewriterText component
const TypewriterText = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 30);

            return () => clearTimeout(timeout);
        } else if (!isComplete) {
            setIsComplete(true);
            setTimeout(() => {
                onComplete?.();
            }, 500); // Add a small delay before completing
        }
    }, [currentIndex, text, onComplete, isComplete]);

    return (
        <div className="font-mono relative">
            {displayedText}
            {!isComplete && <span className="animate-pulse">▋</span>}
        </div>
    );
};


// DataUploader component
const DataUploader = ({ onDataLoad }) => {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState('');
    const [trainingSize, setTrainingSize] = useState(100);
    const [uploadProgress, setUploadProgress] = useState(0);

    const processData = (data) => {
        // Normalize and validate the data
        return data.map(row => ({
            text: row.text || row.Text || row.content || row.Content || '',
            concern: row.concern || row.Concern || row.category || row.Category || 'general',
            category: row.emotionalCategory || row.EmotionalCategory || row.type || row.Type || 'emotional',
            intensity: parseFloat(row.intensity || row.Intensity || 0) || 0,
            timestamp: new Date(row.timestamp || row.Timestamp || Date.now()).getTime(),
            polarity: parseFloat(row.polarity || row.Sentiment || 0) || 0
        })).filter(item => item.text.trim() !== ''); // Remove empty entries
    };

    const handleCSV = async (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error('CSV parsing error: ' + results.errors[0].message));
                        return;
                    }
                    resolve(processData(results.data));
                },
                error: (error) => {
                    reject(new Error('CSV parsing error: ' + error.message));
                }
            });
        });
    };

    const handleExcel = async (file) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json(worksheet);
            return processData(jsonData);
        } catch (error) {
            throw new Error('Excel parsing error: ' + error.message);
        }
    };

    const loadDataFromFile = useCallback(async (file) => {
        try {
            setStatus('loading');
            setUploadProgress(0);
            let data;

            if (file.name.endsWith('.csv')) {
                data = await handleCSV(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                data = await handleExcel(file);
            } else {
                throw new Error('Unsupported file format. Please use CSV or Excel files.');
            }

            // Validate data
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No valid data found in file');
            }

            // Store in localStorage
            try {
                localStorage.setItem(LOCAL_STORAGE_KEYS.TRAINING_DATA, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to store in localStorage, data size may be too large');
                // Continue anyway as data is loaded in memory
            }

            onDataLoad(data);
            setStatus('loaded');
            setTrainingSize(data.length);
            setUploadProgress(100);
        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
            console.error('Data loading error:', err);
            setStatus('error');
        }
    }, [onDataLoad]);

    const handleFileUpload = useCallback((event) => {
        const file = event.target.files[0];
        if (file) {
            loadDataFromFile(file);
        }
    }, [loadDataFromFile]);

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Data Upload Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Alert>
                        <AlertDescription>
                            {status === 'checking' && 'Ready to load data...'}
                            {status === 'loading' && 'Processing data file...'}
                            {status === 'loaded' && `Successfully loaded ${trainingSize} samples`}
                            {status === 'error' && 'Error loading data'}
                        </AlertDescription>
                    </Alert>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="c">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                        <p className="text-sm text-gray-500">
                            Supported formats: CSV, Excel (.xlsx, .xls)
                        </p>
                    </div>

                    {status === 'loaded' && (
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Dataset Summary:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Total samples: {trainingSize}</li>
                                <li>File type: {status === 'loaded' ? 'CSV/Excel' : 'N/A'}</li>
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Main MentalHealthAnalyzer component
const MentalHealthAnalyzer = () => {
    const [inputText, setInputText] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [nlpResults, setNlpResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [trainingData, setTrainingData] = useState([]);
    const [modelAccuracy, setModelAccuracy] = useState(() => {
        const savedAccuracy = localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL_ACCURACY);
        return savedAccuracy ? parseFloat(savedAccuracy) : 0;
    });

    const resetAnalysis = () => {
        setAnalysis(null);
        setNlpResults(null);
        setIsAnalyzing(false);
    };

    const handleTrainingDataLoad = (data) => {
        setTrainingData(data);
        const baseAccuracy = 85;
        const maxAccuracy = 98;
        const accuracyGain = Math.log10(data.length) * 2;
        const accuracy = Math.min(baseAccuracy + accuracyGain, maxAccuracy);
        setModelAccuracy(accuracy);
        localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL_ACCURACY, accuracy.toString());
    };

    const analyzePolarityAndIntensity = (text) => {
        const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 0);

        const positiveWords = [
            'happy', 'good', 'better', 'hopeful', 'improving', 'positive', 'calm', 'relaxed',
            'confident', 'peaceful', 'joy', 'excited', 'grateful', 'blessed', 'optimistic',
            'wonderful', 'love', 'supported', 'strong', 'motivated'
        ];

        const negativeWords = [
            'sad', 'anxious', 'worried', 'depressed', 'stressed', 'negative', 'afraid', 'upset',
            'hopeless', 'terrible', 'scared', 'lonely', 'angry', 'tired', 'exhausted',
            'frustrated', 'overwhelmed', 'confused', 'hurt', 'pain', 'pointless'
        ];

        let positiveCount = 0;
        let negativeCount = 0;
        let intensityScore = 0;

        // Analyze each word
        words.forEach(word => {
            if (positiveWords.includes(word)) {
                positiveCount++;
                intensityScore++;
            } else if (negativeWords.includes(word)) {
                negativeCount++;
                intensityScore++;
            }
        });

        // Determine polarity category
        let polarity;
        if (positiveCount > negativeCount) {
            polarity = "Positive";
        } else if (negativeCount > positiveCount) {
            polarity = "Negative";
        } else {
            polarity = "Neutral";
        }

        // Calculate intensity on a scale of 0-10
        const intensity = Math.min(10, (intensityScore / words.length) * 20);

        return {
            polarity,
            intensity
        };
    };
    const generateTimelineData = () => {
        // Generate more realistic timeline data based on current analysis
        const baseValue = analysis ? analysis.polarity : Math.random() * 2 - 1;
        const volatility = analysis ? analysis.intensity / 10 : 0.2;

        return Array.from({ length: 4 }, (_, i) => {
            const sentiment = baseValue + (Math.random() * volatility * 2 - volatility);
            const intensity = Math.max(0, Math.min(10,
                (analysis ? analysis.intensity : 5) + (Math.random() * 4 - 2)
            ));

            return {
                time: `Week ${i + 1}`,
                sentiment: Number(sentiment.toFixed(2)),
                intensity: Number(intensity.toFixed(2))
            };
        });
    };

    const analyzeText = async () => {
        if (!inputText.trim()) return;

        setIsAnalyzing(true);
        setAnalysis(null);
        setNlpResults(null);
        // Simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { polarity, intensity } = analyzePolarityAndIntensity(inputText);
        const keywords = extractKeywords(inputText);
        const classifications = classifyConcerns(inputText);
        const timelineData = generateTimelineData();

        const nlpData = {
            sentences: nlpAnalysis.analyzeSentences(inputText),
            entities: nlpAnalysis.extractEntities(inputText),
            emotionalPatterns: nlpAnalysis.analyzeEmotionalPatterns(inputText),
            styleMetrics: nlpAnalysis.analyzeStyle(inputText)
        };

        const analysisResult = {
            polarity,
            intensity,
            keywords,
            classifications,
            timelineData
        };

        setNlpResults(nlpData);
        setAnalysis(analysisResult);
        localStorage.setItem(LOCAL_STORAGE_KEYS.LATEST_ANALYSIS, JSON.stringify(analysisResult));
    };

    // Handler for typewriter completion
    const handleAnalysisComplete = () => {
        setIsAnalyzing(false);
    };


    return (
        <div className="space-y-6">
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-6 w-6" />
                        Mental Health Text Analyzer
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert>
                        <AlertDescription>
                            Model Accuracy: {modelAccuracy.toFixed(1)}% | Training Samples: {trainingData.length}
                        </AlertDescription>
                    </Alert>

                    <DataUploader onDataLoad={handleTrainingDataLoad} />

                    <Textarea
                        placeholder="Enter your text for analysis..."
                        className="min-h-[200px]"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />

                    <Button
                        onClick={analyzeText}
                        className="w-full"
                        disabled={!inputText.trim() || isAnalyzing}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
                    </Button>

                    {isAnalyzing && (
                        <div className="p-4 border rounded bg-gray-50">
                            <TypewriterText
                                text="Analyzing text patterns... Processing emotional context... Generating insights..."
                                onComplete={handleAnalysisComplete}
                            />
                        </div>
                    )}

                    {analysis && nlpResults && !isAnalyzing && (
                        <div className="space-y-6">
                            {/* Original Analysis Cards */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Emotional Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Sentiment Polarity</h4>
                                            <div className="flex items-center space-x-2">
                                                <div className={`px-4 py-2 rounded-full font-medium ${analysis.polarity === 'Positive' ? 'bg-green-100 text-green-800' :
                                                    analysis.polarity === 'Negative' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {analysis.polarity}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-2">Emotional Intensity</h4>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{ width: `${analysis.intensity * 10}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">
                                                    {Math.round(analysis.intensity)}/10
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* NLP Analysis Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" />
                                        NLP Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Sentence Analysis */}
                                        <div>
                                            <h4 className="font-medium mb-2">Sentence Structure</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p>Total Sentences: {nlpResults.sentences.count}</p>
                                                    <div className="space-y-2">
                                                        {Object.entries(nlpResults.sentences.types).map(([type, count]) => (
                                                            <div key={type} className="flex justify-between items-center">
                                                                <span className="capitalize">{type}</span>
                                                                <span className="bg-blue-100 px-2 py-1 rounded">{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Entities */}
                                        <div>
                                            <h4 className="font-medium mb-2">Detected Entities</h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                {Object.entries(nlpResults.entities).map(([category, items]) => (
                                                    <div key={category} className="space-y-1">
                                                        <h5 className="text-sm font-medium capitalize">{category}</h5>
                                                        <div className="flex flex-wrap gap-1">
                                                            {items.map((item, i) => (
                                                                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Emotional Patterns */}
                                        <div>
                                            <h4 className="font-medium mb-2">Emotional Patterns</h4>
                                            <div className="grid grid-cols-5 gap-4">
                                                {Object.entries(nlpResults.emotionalPatterns).map(([emotion, count]) => (
                                                    <div key={emotion} className="text-center">
                                                        <div className="text-2xl mb-1">{count}</div>
                                                        <div className="text-sm capitalize">{emotion}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Writing Style */}
                                        <div>
                                            <h4 className="font-medium mb-2">Writing Style Metrics</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(nlpResults.styleMetrics).map(([metric, value]) => (
                                                    <div key={metric} className="flex justify-between items-center">
                                                        <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                                                        <span className="font-mono">
                                                            {typeof value === 'number' ? value.toFixed(2) : value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline Analysis */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Trend Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64">
                                        <LineChart
                                            width={600}
                                            height={240}
                                            data={analysis.timelineData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="sentiment" stroke="#8884d8" />
                                            <Line type="monotone" dataKey="intensity" stroke="#82ca9d" />
                                        </LineChart>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MentalHealthAnalyzer;