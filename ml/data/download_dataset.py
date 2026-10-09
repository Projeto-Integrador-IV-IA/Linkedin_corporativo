import kagglehub

# Download latest version
path = kagglehub.competition_download('job-recommendation')

print("Path to competition files:", path)