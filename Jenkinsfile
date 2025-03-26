pipeline {
  agent {
        // label 'compose'
        docker {
            image 'docker:cli'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
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
            steps{
                checkout scm
            }
        }
        stage('Add Env File'){
            steps{
                script{
                    if(isUnix()){

                        sh '''
                            cat <<EOF > .env
                            EXPRESS_PORT=${EXPRESS_PORT}
                            TOKEN_STRING=${TOKEN_STRING}
                            SOCKET_PORT=${SOCKET_PORT}
                            MONGO_ATLAS_URL=${MONGO_ATLAS_URL}
                            EOF
                        '''
                    }
                    else{
                        bat '''
                            echo EXPRESS_PORT=${EXPRESS_PORT} > .env
                            echo TOKEN_STRING=${TOKEN_STRING} >> .env
                            echo SOCKET_PORT=${SOCKET_PORT} >> .env
                            echo MONGO_ATLAS_URL=${MONGO_ATLAS_URL} >> .env
                        '''
                    }
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
