fn main() {
    let mut num = 5;

    let r1 = &num as *const i32;
    let r2 = &mut num as *mut i32;

    unsafe {
        println!("r1 is: {}", *r1);
        println!("r2 is: {}", *r2);
    }

    let x = 10;
    let y = &x;
    let z = y as *const i32 as usize;
    let p = z as *const i32;
    
    unsafe {
        println!("{}", *p);
    }
}
