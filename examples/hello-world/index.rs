use std::env;

fn main() {
  println!("=== rs ===");
  match env::var("MESSAGE") {
    Ok(val) => println!("{:?}", val),
    Err(e) => println!("{}", e),
  }
}
