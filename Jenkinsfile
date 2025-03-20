pipeline {
    agent {
        dockerContainer {
            image 'docker:latest'
        }
    }
    environment {
        // Define environment variables (can be loaded from Jenkins credentials)
        EXPRESS_PORT = credentials('EXPRESS_PORT')
        SOCKET_PORT = credentials('SOCKET_PORT')
        MONGO_ATLAS_URL = credentials('MONGO_ATLAS_URL')
        TOKEN_STRING = credentials('TOKEN_STRING')
    }
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/yehiamdevops/my-back-end.git'
            }
        }
        stage('Add Env File'){
            steps{
                script{
                    sh '''
                        cat <<EOF > .env
                        EXPRESS_PORT=${EXPRESS_PORT}
                        TOKEN_STRING=${TOKEN_STRING}
                        SOCKET_PORT=${SOCKET_PORT}
                        MONGO_ATLAS_URL=${MONGO_ATLAS_URL}
                        EOF
                        '''
                }
            }

        }
        stage('Build and Run App') {
            steps {
                sh 'docker-compose up --build -d'
            }
        }
    }
}
