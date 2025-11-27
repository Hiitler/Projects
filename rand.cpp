

//write c++ code to generate a random number between 1 and 100
#include <iostream>
#include <cstdlib>
#include <ctime>
int main() {
    std::srand(static_cast<unsigned int>(std::time(0)));
    int randomNumber = std::rand() % 100 + 1;
  std::cout << "Random number between 1 and 100: " << randomNumber << std::endl;

    return 0;
}