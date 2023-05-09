import subprocess
import os

def main():
    # Set your project's root directory path
    project_root = "/Users/lakelonbailey/Documents/GitHub/memebook/"

    # Pull the heroku/heroku:20-build Docker image
    print('Pulling in heroku:20-build Docker Image...')
    subprocess.run(["docker", "pull", "heroku/heroku:20-build"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Define the Docker run command
    docker_run_command = [
        "docker",
        "run",
        "-it",
        "--rm",
        "-v",
        f"{project_root}:/project",
        "heroku/heroku:20-build",
        "/bin/bash",
        "-c"
    ]

    # Define the commands to execute inside the Docker container
    container_commands = [
        "cd /project",
        # "apt-get update",
        # "apt-get install -y g++ make",
        "g++ -shared -o lib/sort_memes.so lib/sort_memes.cpp -fPIC -std=c++11",
    ]

    # Join the container commands into a single string
    container_commands_str = " && ".join(container_commands)

    # Add the container_commands_str to the docker_run_command list
    docker_run_command.append(container_commands_str)

    # Execute the Docker run command
    print('Running compile command through Heroku Docker Image...')
    subprocess.run(docker_run_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if __name__ == "__main__":
    main()
