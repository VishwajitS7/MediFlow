pipeline {
    agent any

    tools {
        // Must match the NodeJS tool name configured in Jenkins Global Tools
        nodejs 'NodeJS-20'
    }

    environment {
        CI = 'true'
        NODE_ENV = 'test'
        NEXTAUTH_SECRET = 'jenkins-ci-pipeline-mock-secret-key-32-chars!'
        NEXTAUTH_URL = 'http://localhost:3000'
        MONGODB_URI = 'mongodb://localhost:27017/mediflow-ci'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo '=== Stage 1: Checking out repository code ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Stage 2: Installing npm dependencies with clean state ==='
                // For Windows agents use bat, for Linux/Unix use sh
                bat 'npm ci'
            }
        }

        stage('Code Quality (Lint)') {
            steps {
                echo '=== Stage 3: Running ESLint code verification ==='
                bat 'npm run lint'
            }
        }

        stage('Strict Typecheck') {
            steps {
                echo '=== Stage 4: Verifying TypeScript compiler types ==='
                bat 'npm run typecheck'
            }
        }

        stage('Unit & Integration Tests') {
            steps {
                echo '=== Stage 5: Executing Vitest test suite ==='
                bat 'npm test'
            }
        }

        stage('Production Build') {
            steps {
                echo '=== Stage 6: Compiling Next.js Turbopack production bundle ==='
                bat 'npm run build'
            }
        }

        stage('Docker Artifact Verification') {
            when {
                expression { return fileExists('Dockerfile') }
            }
            steps {
                echo '=== Stage 7: Dockerfile detected, verifying container build ==='
                bat 'docker build -t mediflow:ci-${BUILD_NUMBER} .'
            }
        }
    }

    post {
        always {
            echo '=== Pipeline Execution Completed ==='
            cleanWs()
        }
        success {
            echo '✅ Pipeline execution and quality gates PASSED successfully!'
        }
        failure {
            echo '❌ Pipeline execution FAILED! Review stage logs above.'
        }
    }
}
