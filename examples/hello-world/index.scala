object Program {
  def main(args: Array[String]) = {
    println("=== scala ===")
    println(sys.env.get("MESSAGE").value)
  }
}