

//write c++ code to generate a random number between 1 and 100
#include <iostream>
#include <cstdlib>
#include <ctime>
int main() {
    // Seed the random number generator
    std::srand(static_cast<unsigned int>(std::time(0)));

    // Generate a random number between 1 and 100
    int randomNumber = std::rand() % 100 + 1;

    // Output the random number
    std::cout << "Random number between 1 and 100: " << randomNumber << std::endl;

    return 0;
}