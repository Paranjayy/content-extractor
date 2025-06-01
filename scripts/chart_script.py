import plotly.graph_objects as go
import pandas as pd
import numpy as np

# Create DataFrame from the provided data
data = [
    {
        "Method": "Web-based Apps",
        "Success_Rate": 30,
        "CORS_Issues": "High",
        "Bulk_Processing": "Limited",
        "Setup_Difficulty": "Easy",
        "API_Dependencies": "High",
        "Description": "Browser-based extractors with CORS limitations"
    },
    {
        "Method": "youtube-transcript-api (Python)",
        "Success_Rate": 95,
        "CORS_Issues": "None",
        "Bulk_Processing": "Excellent",
        "Setup_Difficulty": "Medium",
        "API_Dependencies": "None",
        "Description": "Python library with direct access to YouTube's internal APIs"
    },
    {
        "Method": "yt-dlp",
        "Success_Rate": 90,
        "CORS_Issues": "None",
        "Bulk_Processing": "Good",
        "Setup_Difficulty": "Medium",
        "API_Dependencies": "None",
        "Description": "Command-line tool for downloading and extracting transcripts"
    },
    {
        "Method": "YouTube Data API v3",
        "Success_Rate": 60,
        "CORS_Issues": "Medium",
        "Bulk_Processing": "Poor",
        "Setup_Difficulty": "Hard",
        "API_Dependencies": "High",
        "Description": "Official API with quota limitations and CORS issues"
    },
    {
        "Method": "Local Node.js Solutions",
        "Success_Rate": 85,
        "CORS_Issues": "None",
        "Bulk_Processing": "Good",
        "Setup_Difficulty": "Medium",
        "API_Dependencies": "Low",
        "Description": "Server-side JavaScript solutions"
    }
]

df = pd.DataFrame(data)

# Convert categorical values to numerical scores (normalized to 0-100)
def convert_cors(val):
    mapping = {"High": 25, "Medium": 60, "None": 100}
    return mapping[val]

def convert_bulk(val):
    mapping = {"Poor": 25, "Limited": 50, "Good": 75, "Excellent": 100}
    return mapping[val]

def convert_setup(val):
    mapping = {"Hard": 25, "Medium": 60, "Easy": 100}
    return mapping[val]

def convert_api(val):
    mapping = {"High": 25, "Low": 60, "None": 100}
    return mapping[val]

# Apply conversions
df['CORS_Score'] = df['CORS_Issues'].apply(convert_cors)
df['Bulk_Score'] = df['Bulk_Processing'].apply(convert_bulk)
df['Setup_Score'] = df['Setup_Difficulty'].apply(convert_setup)
df['API_Score'] = df['API_Dependencies'].apply(convert_api)

# Shorten method names for display
df['Short_Method'] = df['Method'].apply(lambda x: 
    'Web Apps' if 'Web-based' in x 
    else 'YT Trans API' if 'youtube-transcript-api' in x
    else 'yt-dlp' if x == 'yt-dlp'
    else 'YT Data API' if 'YouTube Data API' in x
    else 'Node.js'
)

# Brand colors
colors = ['#1FB8CD', '#FFC185', '#ECEBD5', '#5D878F', '#D2BA4C']

# Create radar chart
fig = go.Figure()

# Define categories for radar chart
categories = ['Success Rate', 'CORS Free', 'Bulk Process', 'Easy Setup', 'Low API Deps']

for i, (idx, row) in enumerate(df.iterrows()):
    values = [row['Success_Rate'], row['CORS_Score'], row['Bulk_Score'], 
              row['Setup_Score'], row['API_Score']]
    
    fig.add_trace(go.Scatterpolar(
        r=values,
        theta=categories,
        fill='toself',
        fillcolor=colors[i],
        line=dict(color=colors[i]),
        name=row['Short_Method'],
        opacity=0.6,
        hovertemplate='<b>%{theta}</b><br>' +
                     'Score: %{r}<br>' +
                     '<extra>%{fullData.name}</extra>'
    ))

# Update layout
fig.update_layout(
    title='YouTube Transcript Methods Comparison',
    polar=dict(
        radialaxis=dict(
            visible=True,
            range=[0, 100]
        )
    ),
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Save the chart
fig.write_image('youtube_transcript_methods_comparison.png')